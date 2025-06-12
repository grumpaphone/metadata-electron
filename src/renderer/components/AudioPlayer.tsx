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
	height: 90px; // Increased from 80px to accommodate higher resolution waveform
	background: rgba(20, 20, 30, 0.9);
	backdrop-filter: blur(15px);
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	display: flex;
	align-items: center;
	padding: 0 20px;
	gap: 15px;
	transform: translateY(${(props) => (props.isVisible ? '0' : '100%')});
	transition: transform 0.3s ease-in-out;
	z-index: 100;
	color: white;
`;

const WaveformContainer = styled.div`
	flex-grow: 1;
	height: 70px; // Increased from 60px to accommodate the higher resolution waveform
	cursor: pointer;

	/* Style the waveform container to be more visually prominent */
	background: rgba(0, 0, 0, 0.3);
	border-radius: 8px;
	padding: 5px;
`;

const TimeDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	color: #ccc;
`;

// --- MAIN COMPONENT ---
export const AudioPlayer: React.FC = () => {
	console.log('[PLAYER] Rendering...');

	// Only subscribe to essential state that affects visibility and file loading
	// Explicitly exclude currentTime to prevent re-renders on time updates
	const { currentFile, isLoading, isPlaying, isMinimized } =
		useStoreWithEqualityFn(
			useStore,
			(state) => ({
				currentFile: state.audioPlayer.currentFile,
				isLoading: state.audioPlayer.isLoading,
				isPlaying: state.audioPlayer.isPlaying,
				isMinimized: state.audioPlayer.isMinimized,
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
			timeDisplayRef.current.innerHTML = `
				<div>${formatTime(currentTime)}</div>
				<div style="color: #666; font-size: 10px;">${formatTime(duration)}</div>
			`;
		}
	}, []);

	// Initialize WaveSurfer only once
	useEffect(() => {
		console.log('[PLAYER-EFFECT] Initializing WaveSurfer...');

		if (!waveformRef.current) {
			console.log(
				'[PLAYER-EFFECT] waveformRef.current is null, cannot initialize WaveSurfer'
			);
			return;
		}

		console.log('[PLAYER-EFFECT] Creating WaveSurfer instance...');
		const ws = WaveSurfer.create({
			container: waveformRef.current,
			waveColor: '#4a5568',
			progressColor: '#007aff',
			cursorColor: '#007aff',
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

		console.log('[PLAYER-EFFECT] WaveSurfer instance created:', !!ws);

		// Event listeners with v7 optimizations
		ws.on('ready', () => {
			console.log('[PLAYER-WAVESURFER] Ready');
			setWaveformReady(true);

			// Set duration when waveform is ready
			const duration = ws.getDuration();
			useStore.getState().setDuration(duration);
			console.log('[PLAYER-WAVESURFER] Duration set:', duration);

			// Update time display with initial values
			updateTimeDisplay(0);

			if (playOnReadyRef.current) {
				console.log('[PLAYER-WAVESURFER] Auto-playing on ready');
				ws.play();
				playOnReadyRef.current = false;
			}
		});

		// Click-to-seek functionality
		ws.on('interaction', () => {
			console.log('[PLAYER-WAVESURFER] Waveform clicked for seeking');
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
			console.log('[PLAYER-WAVESURFER] Finished playing');
			stopAudio();
			playOnReadyRef.current = false;
		});

		ws.on('error', (e) => {
			console.error('[PLAYER-WAVESURFER] Error:', e);
			playOnReadyRef.current = false;
		});

		// v7 loading events
		ws.on('loading', (percent) => {
			console.log('[PLAYER-WAVESURFER] Loading:', percent + '%');
		});

		// Add click event listener to enable seeking by clicking on waveform
		ws.on('click', (relativeX) => {
			console.log('[PLAYER-WAVESURFER] Clicked at position:', relativeX);
			const duration = ws.getDuration();
			const seekTime = relativeX * duration;
			console.log('[PLAYER-WAVESURFER] Seeking to:', seekTime);
			ws.seekTo(relativeX);
		});

		return () => {
			console.log('[PLAYER-EFFECT] Destroying WaveSurfer...');
			ws.destroy();
			wavesurferRef.current = null;
			// Clean up global reference
			delete (window as any).wavesurferInstance;
		};
	}, []); // Empty dependency array - initialize only once

	// Handle file loading
	useEffect(() => {
		console.log('[PLAYER-EFFECT] File/loading state changed.', {
			fileName: currentFile?.filename,
			isLoading,
			isPlaying,
		});

		// Skip if same file is already loaded
		if (currentFile && currentFilePathRef.current === currentFile.filePath) {
			console.log('[PLAYER-EFFECT] Same file already loaded, skipping');
			return;
		}

		if (currentFile && !isLoading) {
			const ws = wavesurferRef.current;

			if (!ws) {
				console.log('[PLAYER-EFFECT] WaveSurfer not available');
				return;
			}

			const audioData = getAudioDataFromCache(currentFile.filePath);

			console.log('[PLAYER-EFFECT] Checking audio data:', {
				hasWaveSurfer: !!ws,
				hasAudioData: !!audioData,
				audioDataSize: audioData ? audioData.byteLength : 0,
				isPlaying,
				filePath: currentFile.filePath,
			});

			if (audioData) {
				console.log(
					'[PLAYER-EFFECT] Loading blob... Audio data size:',
					audioData.byteLength
				);

				// Reset waveform ready state
				setWaveformReady(false);

				if (isPlaying) {
					playOnReadyRef.current = true;
					console.log('[PLAYER-EFFECT] Set playOnReady = true');
				}

				const blob = new Blob([audioData], { type: 'audio/wav' });
				const url = URL.createObjectURL(blob);
				console.log('[PLAYER-EFFECT] Created blob URL, calling ws.load()');

				// Update the current file reference
				currentFilePathRef.current = currentFile.filePath;

				ws.load(url);
			} else {
				console.log(
					'[PLAYER-EFFECT] Audio data not found in cache for:',
					currentFile.filePath
				);
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
				console.log('[PLAYER-EFFECT] Playing audio');
				ws.play();
			} else {
				console.log('[PLAYER-EFFECT] Pausing audio');
				ws.pause();
			}
		}
	}, [isPlaying]);

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
