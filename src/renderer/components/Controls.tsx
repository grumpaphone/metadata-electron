import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const ControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
`;

const PlayerButton = styled.button`
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.2);
	color: white;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
	font-size: 1.2em;
	&:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`;

export const Controls: React.FC = () => {
	console.log('[Controls] Rendering...');
	const { isPlaying, isLoading } = useStore(
		(state) => ({
			isPlaying: state.audioPlayer.isPlaying,
			isLoading: state.audioPlayer.isLoading,
		}),
		shallow
	);

	console.log('[Controls] State:', {
		isPlaying,
		isLoading,
		currentFile:
			useStore.getState().audioPlayer.currentFile?.filename || 'none',
	});

	const handleTogglePlayPause = useCallback(() => {
		console.log('[Controls] Toggle play/pause clicked');
		useStore.getState().togglePlayPause();
	}, []);

	const handleStop = useCallback(() => {
		console.log('[Controls] Stop button clicked');
		useStore.getState().stopAudio();
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
