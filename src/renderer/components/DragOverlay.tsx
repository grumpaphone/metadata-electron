import React from 'react';
import styled from '@emotion/styled';
import { DropFileIcon } from './Icons';

const Overlay = styled.div`
	position: absolute;
	top: 0; left: 0; right: 0; bottom: 0;
	background: var(--drag-overlay-bg);
	border: 2px dashed var(--drag-overlay-border);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	pointer-events: none;
	animation: pulseGlow 2s ease-in-out infinite alternate;

	@keyframes pulseGlow {
		0% { opacity: 0.85; }
		100% { opacity: 1; }
	}
`;

const Message = styled.div`
	background: var(--drag-message-bg);
	color: var(--text-primary);
	padding: 28px 40px;
	border-radius: 16px;
	text-align: center;
	box-shadow: 0 24px 48px rgba(0, 0, 0, 0.3);
	border: 1px solid var(--drag-message-border);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
`;

const IconWrapper = styled.div`
	color: var(--accent-primary);
`;

const Text = styled.div`
	font-size: 18px;
	font-weight: 600;
`;

const Subtext = styled.div`
	font-size: 13px;
	opacity: 0.7;
	font-weight: 400;
	color: var(--text-secondary);
`;

export const DragOverlay: React.FC = () => (
	<Overlay>
		<Message>
			<IconWrapper>
				<DropFileIcon size={48} />
			</IconWrapper>
			<Text>Drop files here</Text>
			<Subtext>.wav files and folders accepted</Subtext>
		</Message>
	</Overlay>
);
