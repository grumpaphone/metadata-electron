import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { WaveSurferController } from '../audio/WaveSurferController';

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
`;

const PlayerButton = styled.button`
	background: var(--border-secondary);
	border: 1px solid var(--border-primary);
	color: var(--text-primary);
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	font-size: 1.2em;
	transition: background 0.2s ease;
	&:hover {
		background: var(--table-row-hover);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
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
				{isPlaying ? '⏸' : '▶'}
			</PlayerButton>
			<PlayerButton onClick={handleStop} aria-label="Stop">⏹</PlayerButton>
		</ControlsContainer>
	);
};
