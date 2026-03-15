import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { Controls } from './Controls';
import { VolumeControl } from './VolumeControl';
import { WaveSurferController } from '../audio/WaveSurferController';

const PlayerContainer = styled.div<{ isVisible: boolean }>`
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 90px;
	background: var(--player-bg, var(--bg-secondary));
	border-top: 1px solid var(--border-primary);
	display: flex;
	align-items: center;
	padding: 0 20px;
	gap: 15px;
	transform: translateY(${(props) => (props.isVisible ? '0' : '100%')});
	transition: transform 0.3s ease-in-out;
	z-index: 100;
	color: var(--text-primary);
	border-bottom-left-radius: var(--window-corner-radius);
	border-bottom-right-radius: var(--window-corner-radius);
	overflow: hidden;
`;

const WaveformContainer = styled.div`
	flex-grow: 1;
	height: 70px;
	cursor: pointer;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.05);
	border-radius: 8px;
	padding: 5px;
	box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
`;

const TimeDisplay = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	min-width: 80px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	color: var(--text-secondary);
`;

const CurrentTime = styled.div``;
const DurationTime = styled.div`
	color: var(--text-muted);
	font-size: 10px;
`;

export const AudioPlayer: React.FC = () => {
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
	const currentFilePathRef = useRef<string | null>(null);
	const currentTimeRef = useRef<HTMLDivElement>(null);
	const durationTimeRef = useRef<HTMLDivElement>(null);
	const controllerRef = useRef<WaveSurferController | null>(null);

	const formatTime = useCallback((seconds: number): string => {
		if (isNaN(seconds) || seconds < 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}, []);

	const updateTimeDisplay = useCallback((currentTime: number) => {
		if (currentTimeRef.current) {
			currentTimeRef.current.textContent = formatTime(currentTime);
		}
		if (durationTimeRef.current) {
			const duration = useStore.getState().audioPlayer.duration;
			durationTimeRef.current.textContent = formatTime(duration);
		}
	}, [formatTime]);

	// Initialize WaveSurfer controller once
	useEffect(() => {
		if (!waveformRef.current) return;

		const controller = WaveSurferController.getInstance();
		controller.init(waveformRef.current);
		controllerRef.current = controller;

		const store = useStore.getState();
		controller.setVolume(store.audioPlayer.volume);

		controller.setCallbacks({
			onTimeUpdate: (time) => {
				useStore.getState().setCurrentTime(time);
				updateTimeDisplay(time);
			},
			onReady: (duration) => {
				useStore.getState().setWaveformReady(true);
				useStore.getState().setDuration(duration);
				updateTimeDisplay(0);
			},
			onFinish: () => {
				useStore.getState().stopAudio();
			},
			onError: (msg) => {
				console.error('[PLAYER] WaveSurfer error:', msg);
				useStore.getState().setError(`Audio error: ${msg}`);
			},
		});

		return () => {
			controller.destroy();
			controllerRef.current = null;
		};
	}, [updateTimeDisplay]);

	// Handle file loading
	useEffect(() => {
		if (currentFile && currentFilePathRef.current === currentFile.filePath) {
			return;
		}

		if (currentFile && !isLoading) {
			const controller = controllerRef.current;
			if (!controller) return;

			const audioData = useStore.getState().getAudioDataFromCache(currentFile.filePath);
			if (audioData) {
				useStore.getState().setWaveformReady(false);
				currentFilePathRef.current = currentFile.filePath;
				controller.loadBlob(audioData, isPlaying);
			}
		}
	}, [currentFile?.filePath, isLoading, isPlaying]);

	// Handle play/pause state changes
	useEffect(() => {
		const controller = controllerRef.current;
		if (controller && controller.isReady()) {
			if (isPlaying) {
				controller.play();
			} else {
				controller.pause();
			}
		}
	}, [isPlaying]);

	// Handle volume changes
	useEffect(() => {
		controllerRef.current?.setVolume(volume);
	}, [volume]);

	const isVisible = useMemo(() => {
		return !!currentFile && !isMinimized;
	}, [currentFile, isMinimized]);

	return (
		<PlayerContainer isVisible={isVisible}>
			<Controls />
			<WaveformContainer ref={waveformRef} />
			<TimeDisplay>
				<CurrentTime ref={currentTimeRef}>0:00</CurrentTime>
				<DurationTime ref={durationTimeRef}>0:00</DurationTime>
			</TimeDisplay>
			<VolumeControl />
		</PlayerContainer>
	);
};
