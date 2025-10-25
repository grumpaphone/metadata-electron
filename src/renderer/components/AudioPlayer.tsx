import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import WaveSurfer from 'wavesurfer.js';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { Controls } from './Controls';
import { VolumeControl } from './VolumeControl';

// --- STYLED COMPONENTS ---

const PlayerContainer = styled.div<{ isVisible: boolean }>`
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 90px;
	background: rgba(10, 14, 24, 0.78);
	border-top: 1px solid var(--border-primary);
	display: flex;
	align-items: center;
	padding: 0 20px;
	gap: 15px;
	transform: translateY(${(props) => (props.isVisible ? '0' : '100%')});
	transition: transform 0.3s ease-in-out;
	z-index: 100;
	color: var(--player-text);

	/* Match app container corners on bottom edges */
	border-bottom-left-radius: var(--window-corner-radius);
	border-bottom-right-radius: var(--window-corner-radius);

	/* Prevent any overflow */
	overflow: hidden;
`;

const WaveformContainer = styled.div`
	flex-grow: 1;
	height: 70px;
	cursor: pointer;

	/* Subtle inset styling - no additional glass (parent provides it) */
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 8px;
	padding: 5px;

	/* Subtle inner shadow for depth */
	box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
`;

const TimeDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	color: var(--player-text-muted);
`;

// --- MAIN COMPONENT ---
export const AudioPlayer: React.FC = () => {
	// Only subscribe to essential state that affects visibility and file loading
	// Explicitly exclude currentTime to prevent re-renders on time updates
	const { currentFile, isLoading, isPlaying, isMinimized, volume } =
		useStoreWithEqualityFn(
			useStore,
			(state) => ({
				currentFile: state.audioPlayer.currentFile,
				isLoading: state.audioPlayer.isLoading,
				isPlaying: state.audioPlayer.isPlaying,
				isMinimized: state.audioPlayer.isMinimized,
				volume: state.audioPlayer.volume,
			}),
			shallow
		);

	const waveformRef = useRef<HTMLDivElement>(null);
	const wavesurferRef = useRef<WaveSurfer | null>(null);
	const playOnReadyRef = useRef(false);
	const currentFilePathRef = useRef<string | null>(null);
	const timeDisplayRef = useRef<HTMLDivElement>(null);
	const isWaveformReadyRef = useRef(false); // Track ready state locally

	// Stable callback functions using useCallback
	const setWaveformReady = useCallback((ready: boolean) => {
		isWaveformReadyRef.current = ready;
		useStore.getState().setWaveformReady(ready);
	}, []);

	const setCurrentTime = useCallback((time: number) => {
		useStore.getState().setCurrentTime(time);
		// Update time display directly
		updateTimeDisplay(time);
	}, []);

	const stopAudio = useCallback(() => {
		const ws = wavesurferRef.current;
		if (ws && isWaveformReadyRef.current) {
			console.log('[PLAYER-EFFECT] Stopping WaveSurfer');
			ws.stop(); // This stops playback and resets to beginning
		}
		useStore.getState().stopAudio();
	}, []);

	const getAudioDataFromCache = useCallback((filePath: string) => {
		return useStore.getState().getAudioDataFromCache(filePath);
	}, []);

	// Direct DOM update function for time display (avoids React re-renders)
	const updateTimeDisplay = useCallback((currentTime: number) => {
		if (timeDisplayRef.current) {
			const formatTime = (seconds: number): string => {
				if (isNaN(seconds) || seconds < 0) return '0:00';
				const mins = Math.floor(seconds / 60);
				const secs = Math.floor(seconds % 60);
				return `${mins}:${secs.toString().padStart(2, '0')}`;
			};

			const duration = useStore.getState().audioPlayer.duration;
			const dimColor = getComputedStyle(document.documentElement)
				.getPropertyValue('--player-text-dim')
				.trim();
			timeDisplayRef.current.innerHTML = `
				<div>${formatTime(currentTime)}</div>
				<div style="color: ${dimColor || '#666'}; font-size: 10px;">${formatTime(
				duration
			)}</div>
			`;
		}
	}, []);

	// Initialize WaveSurfer only once
	useEffect(() => {
		if (!waveformRef.current) {
			return;
		}

		// Get CSS variable values for WaveSurfer colors
		const computedStyle = getComputedStyle(document.documentElement);
		const waveColor = computedStyle.getPropertyValue('--waveform-wave').trim();
		const progressColor = computedStyle
			.getPropertyValue('--waveform-progress')
			.trim();
		const cursorColor = computedStyle
			.getPropertyValue('--waveform-cursor')
			.trim();

		const ws = WaveSurfer.create({
			container: waveformRef.current,
			waveColor: waveColor || '#4a5568',
			progressColor: progressColor || '#007aff',
			cursorColor: cursorColor || '#007aff',
			height: 60, // Increased from 50 to 60 for better visual detail
			normalize: true,
			barWidth: 1, // Reduced from 2 to 1 for more detail
			barGap: 0.5, // Reduced from 1 to 0.5 for tighter spacing
			barRadius: 1, // Reduced from 2 to 1 for sharper bars
			// Enable interaction for click-to-seek
			interact: true,
		});
		wavesurferRef.current = ws;

		// Expose WaveSurfer instance globally for cross-component access
		(window as any).wavesurferInstance = ws;

		// Expose stopAudio function globally for cross-component access
		(window as any).stopAudioFunction = stopAudio;

		// Set initial volume
		const initialVolume = useStore.getState().audioPlayer.volume;
		ws.setVolume(initialVolume);

		// Event listeners with v7 optimizations
		ws.on('ready', () => {
			setWaveformReady(true);

			// Set duration when waveform is ready
			const duration = ws.getDuration();
			useStore.getState().setDuration(duration);

			// Update time display with initial values
			updateTimeDisplay(0);

			if (playOnReadyRef.current) {
				ws.play();
				playOnReadyRef.current = false;
			}
		});

		// Click-to-seek functionality
		ws.on('interaction', () => {
			// WaveSurfer automatically handles seeking on click in v7
		});

		// Use 'audioprocess' event for time updates (correct v7 event)
		let lastTimeUpdate = 0;
		ws.on('audioprocess', (currentTime) => {
			const now = Date.now();
			if (now - lastTimeUpdate > 100) {
				// Update only every 100ms
				setCurrentTime(currentTime);
				lastTimeUpdate = now;
			}
		});

		ws.on('finish', () => {
			stopAudio();
			playOnReadyRef.current = false;
		});

		ws.on('error', (e) => {
			console.error('[PLAYER-WAVESURFER] Error:', e);
			playOnReadyRef.current = false;
		});

		// Add click event listener to enable seeking by clicking on waveform
		ws.on('click', (relativeX) => {
			ws.seekTo(relativeX);
		});

		return () => {
			ws.destroy();
			wavesurferRef.current = null;
			// Clean up global references
			delete (window as any).wavesurferInstance;
			delete (window as any).stopAudioFunction;
		};
	}, []); // Empty dependency array - initialize only once

	// Handle file loading
	useEffect(() => {
		// Skip if same file is already loaded
		if (currentFile && currentFilePathRef.current === currentFile.filePath) {
			return;
		}

		if (currentFile && !isLoading) {
			const ws = wavesurferRef.current;

			if (!ws) {
				return;
			}

			const audioData = getAudioDataFromCache(currentFile.filePath);

			if (audioData) {
				// Reset waveform ready state
				setWaveformReady(false);

				if (isPlaying) {
					playOnReadyRef.current = true;
				}

				const blob = new Blob([audioData], { type: 'audio/wav' });
				const url = URL.createObjectURL(blob);

				// Update the current file reference
				currentFilePathRef.current = currentFile.filePath;

				ws.load(url);
			}
		}
	}, [
		currentFile?.filePath,
		isLoading,
		isPlaying,
		getAudioDataFromCache,
		setWaveformReady,
	]); // Only essential dependencies

	// Handle play/pause state changes
	useEffect(() => {
		const ws = wavesurferRef.current;
		if (ws && isWaveformReadyRef.current) {
			if (isPlaying) {
				ws.play();
			} else {
				ws.pause();
			}
		}
	}, [isPlaying]);

	// Handle volume changes
	useEffect(() => {
		const ws = wavesurferRef.current;
		if (ws) {
			ws.setVolume(volume);
		}
	}, [volume]);

	// Memoize visibility calculation
	const isVisible = useMemo(() => {
		return !!currentFile && !isMinimized;
	}, [currentFile, isMinimized]);

	return (
		<PlayerContainer isVisible={isVisible}>
			<Controls />
			<WaveformContainer ref={waveformRef} />
			<TimeDisplay ref={timeDisplayRef}>
				<div>0:00</div>
				<div style={{ color: '#666', fontSize: '10px' }}>0:00</div>
			</TimeDisplay>
			<VolumeControl />
		</PlayerContainer>
	);
};
