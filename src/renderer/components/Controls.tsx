import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { WaveSurferController } from '../audio/WaveSurferController';
import { PlayIcon, PauseIcon, StopIcon } from './Icons';

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const PlayerButton = styled.button`
	background: var(--fill-tertiary);
	border: 1px solid var(--border-secondary);
	color: var(--text-primary);
	border-radius: 50%;
	width: 36px;
	height: 36px;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	transition: background 0.15s ease, transform 0.1s ease;

	&:hover {
		background: var(--fill-secondary);
	}

	&:active {
		transform: scale(0.95);
	}

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.25);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	body.reduce-motion & { transition: none; transform: none !important; }
`;

export const Controls: React.FC = () => {
	const { isPlaying } = useStoreWithEqualityFn(
		useStore,
		(state) => ({
			isPlaying: state.audioPlayer.isPlaying,
		}),
		shallow
	);

	const handleTogglePlayPause = useCallback(() => {
		useStore.getState().togglePlayPause();
	}, []);

	const handleStop = useCallback(() => {
		const controller = WaveSurferController.getInstance();
		controller.stop();
		useStore.getState().stopAudio();
	}, []);

	return (
		<ControlsContainer>
			<PlayerButton onClick={handleTogglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'}>
				{isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
			</PlayerButton>
			<PlayerButton onClick={handleStop} aria-label="Stop">
				<StopIcon size={12} />
			</PlayerButton>
		</ControlsContainer>
	);
};
