import React from 'react';
import styled from '@emotion/styled';

const Controls = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const Light = styled.button<{ color: string }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 0;
	padding: 0;
	background: ${(p) => p.color};
	box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.2);
	cursor: pointer;
	appearance: none;
	-webkit-app-region: no-drag;

	&:focus {
		outline: none;
	}
`;

export const WindowControls: React.FC = () => {
	const onClose = () => window.electronAPI?.windowClose?.();
	const onMinimize = () => window.electronAPI?.windowMinimize?.();
	const onZoom = () => window.electronAPI?.windowToggleFullscreen?.();

	return (
		<Controls>
			<Light aria-label='Close window' color='#ff5f57' onClick={onClose} />
			<Light
				aria-label='Minimize window'
				color='#febc2e'
				onClick={onMinimize}
			/>
			<Light aria-label='Toggle fullscreen' color='#28c840' onClick={onZoom} />
		</Controls>
	);
};


