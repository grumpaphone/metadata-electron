import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';
import { useFocusTrap } from '../utils/useFocusTrap';

const DialogOverlay = styled.div`
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: var(--modal-overlay);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 2000;
`;

const DialogContent = styled(VibrancyLayer)`
	padding: 28px;
	border-radius: 12px;
	width: 90%;
	max-width: 400px;
	box-shadow: var(--shadow-md);
	text-align: center;
	color: var(--text-primary);
`;

const Title = styled.h2`
	margin-top: 0;
	color: var(--color-error);
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
	border-radius: 6px;
	border: 1px solid var(--border-secondary);
	cursor: pointer;
	font-weight: 600;
	background: var(--fill-tertiary);
	color: var(--text-secondary);
	transition: all 0.2s ease;
	&:hover {
		background: var(--fill-secondary);
	}
`;

interface ErrorDialogProps {
	message: string;
	onClose: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ message, onClose }) => {
	const trapRef = useFocusTrap(!!message);

	useEffect(() => {
		if (!message) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [message, onClose]);

	if (!message) return null;

	return (
		<DialogOverlay onClick={onClose}>
			<DialogContent ref={trapRef} intensity="strong" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Error">
				<Title>Error</Title>
				<Message>{message}</Message>
				<CloseButton onClick={onClose}>Close</CloseButton>
			</DialogContent>
		</DialogOverlay>
	);
};
