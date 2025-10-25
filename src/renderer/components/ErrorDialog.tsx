import React from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const DialogOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--modal-overlay);
	backdrop-filter: var(--glass-backdrop);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
`;

const DialogContent = styled(VibrancyLayer)`
	padding: 28px;
	border-radius: 16px;
	border: 1px solid var(--border-primary);
	width: 90%;
	max-width: 400px;
	box-shadow: 0 20px 40px rgba(12, 22, 43, 0.38),
		inset 0 1px 0 rgba(255, 255, 255, 0.12);
	text-align: center;
	color: var(--text-primary);
`;

const Title = styled.h2`
	margin-top: 0;
	color: rgba(255, 120, 140, 0.95);
	font-weight: 600;
`;

const Message = styled.p`
	color: var(--text-secondary);
	margin-bottom: 25px;
	font-size: 14px;
	line-height: 1.5;
`;

const CloseButton = styled.button`
	padding: 10px 20px;
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.18);
	cursor: pointer;
	font-weight: 600;
	background: linear-gradient(
		145deg,
		rgba(255, 255, 255, 0.16) 0%,
		rgba(255, 255, 255, 0.1) 100%
	);
	color: var(--text-secondary);
	transition: all 0.2s ease;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);

	&:hover {
		background: linear-gradient(
			145deg,
			rgba(255, 255, 255, 0.2) 0%,
			rgba(255, 255, 255, 0.12) 100%
		);
		transform: translateY(-1px);
	}
`;

interface ErrorDialogProps {
	message: string;
	onClose: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
	message,
	onClose,
}) => {
	if (!message) return null;

	return (
		<DialogOverlay onClick={onClose}>
			<DialogContent intensity='strong' onClick={(e) => e.stopPropagation()}>
				<Title>Error</Title>
				<Message>{message}</Message>
				<CloseButton onClick={onClose}>Close</CloseButton>
			</DialogContent>
		</DialogOverlay>
	);
};
