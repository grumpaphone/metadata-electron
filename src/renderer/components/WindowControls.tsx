import React from 'react';
import styled from '@emotion/styled';
import { FullscreenIcon } from './Icons';

const Controls = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;

	&:hover span {
		opacity: 1;
	}
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
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;

	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 2px ${(p) => p.color}, 0 0 0 4px rgba(255, 255, 255, 0.3);
	}

	&:active {
		filter: brightness(0.85);
	}
`;

const LightSymbol = styled.span`
	font-size: 8px;
	line-height: 1;
	font-weight: 700;
	color: rgba(0, 0, 0, 0.5);
	opacity: 0;
	transition: opacity 0.1s ease;
	pointer-events: none;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	body.reduce-motion & { transition: none; }
`;

const isMac = (): boolean => {
	if (typeof navigator === 'undefined') return true;
	const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
		?? navigator.platform
		?? '';
	return /mac/i.test(platform) || /mac/i.test(navigator.userAgent || '');
};

export const WindowControls: React.FC = () => {
	if (!isMac()) return null;

	const onClose = () => window.electronAPI?.windowClose?.();
	const onMinimize = () => window.electronAPI?.windowMinimize?.();
	const onZoom = () => window.electronAPI?.windowToggleFullscreen?.();

	return (
		<Controls>
			<Light aria-label='Close window' color='#ff5f57' onClick={onClose}>
				<LightSymbol>&#10005;</LightSymbol>
			</Light>
			<Light aria-label='Minimize window' color='#febc2e' onClick={onMinimize}>
				<LightSymbol>&#8722;</LightSymbol>
			</Light>
			<Light aria-label='Toggle fullscreen' color='#28c840' onClick={onZoom}>
				<LightSymbol><FullscreenIcon size={8} color='rgba(0,0,0,0.55)' /></LightSymbol>
			</Light>
		</Controls>
	);
};
