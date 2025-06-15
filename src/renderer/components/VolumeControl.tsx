import React from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const VolumeContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const VolumeSlider = styled.input`
	width: 80px;
	height: 4px;
	background: var(--border-primary);
	border-radius: 2px;
	outline: none;
	cursor: pointer;

	&::-webkit-slider-thumb {
		appearance: none;
		width: 12px;
		height: 12px;
		background: var(--accent-primary);
		border-radius: 50%;
		cursor: pointer;
	}

	&::-moz-range-thumb {
		width: 12px;
		height: 12px;
		background: var(--accent-primary);
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
`;

export const VolumeControl: React.FC = () => {
	console.log('[VolumeControl] Rendering...');
	const { volume } = useStoreWithEqualityFn(
		useStore,
		(state) => ({
			volume: state.audioPlayer.volume,
		}),
		shallow
	);
	const { setVolume } = useStore.getState();

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		console.log('[VolumeControl] Volume changed to:', newVolume);
		setVolume(newVolume);
	};

	console.log('[VolumeControl] Current volume:', volume);

	return (
		<VolumeContainer>
			<span>🔊</span>
			<VolumeSlider
				type='range'
				min='0'
				max='1'
				step='0.05'
				value={volume}
				onChange={handleVolumeChange}
			/>
		</VolumeContainer>
	);
};
