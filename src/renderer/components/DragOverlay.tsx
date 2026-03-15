import React from 'react';
import styled from '@emotion/styled';

const Overlay = styled.div`
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	background: rgba(90, 150, 255, 0.14);
	border: 2px dashed rgba(120, 173, 255, 0.6);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	pointer-events: none;
	animation: pulseGlow 2s ease-in-out infinite alternate;

	@keyframes pulseGlow {
		0% { background: rgba(90, 150, 255, 0.12); border-color: rgba(120, 173, 255, 0.68); }
		100% { background: rgba(90, 150, 255, 0.2); border-color: rgba(146, 194, 255, 0.9); }
	}
`;

const Message = styled.div`
	background: rgba(15, 28, 52, 0.85);
	color: var(--text-primary);
	padding: 24px 36px;
	border-radius: 16px;
	font-size: 18px;
	font-weight: 600;
	text-align: center;
	box-shadow: 0 24px 48px rgba(8, 20, 42, 0.5);
	border: 1px solid rgba(120, 173, 255, 0.4);

	.icon { font-size: 48px; margin-bottom: 12px; display: block; }
	.text { font-size: 18px; margin-bottom: 8px; }
	.subtext { font-size: 13px; opacity: 0.7; font-weight: 400; color: var(--text-secondary); }
`;

export const DragOverlay: React.FC = () => (
	<Overlay>
		<Message>
			<span className="icon">📂</span>
			<div className="text">Drop files here</div>
			<div className="subtext">.wav files and folders accepted</div>
		</Message>
	</Overlay>
);
