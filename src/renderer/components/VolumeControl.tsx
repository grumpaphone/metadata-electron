import React from 'react';
import styled from '@emotion/styled';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const VolumeContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const VolumeSlider = styled.input`
	width: 80px;
`;

export const VolumeControl: React.FC = () => {
	console.log('[VolumeControl] Rendering...');
	const { volume } = useStore(
		(state) => ({
			volume: state.audioPlayer.volume,
		}),
		shallow
	);
	const { setVolume } = useStore.getState();

	return (
		<VolumeContainer>
			<span>🔊</span>
			<VolumeSlider
				type='range'
				min='0'
				max='1'
				step='0.05'
				value={volume}
				onChange={(e) => setVolume(parseFloat(e.target.value))}
			/>
		</VolumeContainer>
	);
};
