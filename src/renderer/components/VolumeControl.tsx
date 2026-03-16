import React from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { VolumeIcon, VolumeMuteIcon } from './Icons';

const VolumeContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	color: var(--text-secondary);
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
		setVolume(newVolume);
	};

	return (
		<VolumeContainer>
			{volume === 0 ? <VolumeMuteIcon size={16} /> : <VolumeIcon size={16} />}
			<VolumeSlider
				type='range'
				min='0'
				max='1'
				step='0.05'
				value={volume}
				onChange={handleVolumeChange}
				aria-label="Volume"
			/>
		</VolumeContainer>
	);
};
