import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
`;

const PlayerButton = styled.button`
	background: var(--border-secondary);
	border: 1px solid var(--border-primary);
	color: var(--player-text);
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
	const { isPlaying, isLoading } = useStoreWithEqualityFn(
		useStore,
		(state) => ({
			isPlaying: state.audioPlayer.isPlaying,
			isLoading: state.audioPlayer.isLoading,
		}),
		shallow
	);

	const handleTogglePlayPause = useCallback(() => {
		useStore.getState().togglePlayPause();
	}, []);

	const handleStop = useCallback(() => {
		// Try to use the global stopAudioFunction first (which controls WaveSurfer directly)
		const globalStopFunction = (window as any).stopAudioFunction;
		if (globalStopFunction) {
			globalStopFunction();
		} else {
			useStore.getState().stopAudio();
		}
	}, []);

	return (
		<ControlsContainer>
			<PlayerButton onClick={handleTogglePlayPause}>
				{isPlaying ? '⏸' : '▶'}
			</PlayerButton>
			<PlayerButton onClick={handleStop}>⏹</PlayerButton>
		</ControlsContainer>
	);
};
