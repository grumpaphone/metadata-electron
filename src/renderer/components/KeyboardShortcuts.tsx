import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: var(--modal-overlay);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 2000;
`;

const ModalContent = styled(VibrancyLayer)`
	padding: 28px;
	border-radius: 12px;
	width: 90%;
	max-width: 500px;
	box-shadow: var(--shadow-md);
	color: var(--text-primary);
`;

const Title = styled.h2`
	margin-top: 0;
	color: var(--text-primary);
	font-weight: 600;
	text-align: center;
	margin-bottom: 20px;
`;

const ShortcutList = styled.ul`
	list-style: none;
	padding: 0;
	margin: 0;
	color: var(--text-secondary);
`;

const ShortcutItem = styled.li`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid var(--border-secondary);
	&:last-child { border-bottom: none; }
`;

const ShortcutLabel = styled.span`
	font-size: 14px;
`;

const Key = styled.kbd`
	background: var(--fill-tertiary);
	padding: 6px 10px;
	border-radius: 6px;
	border: 1px solid var(--border-secondary);
	font-family: 'Monaco', 'Menlo', monospace;
	color: var(--text-primary);
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 24px;
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
	&:hover { background: var(--fill-secondary); }
`;

interface KeyboardShortcutsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
	useEffect(() => {
		if (!isOpen) return;
		const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent intensity="strong" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Keyboard Shortcuts">
				<Title>Keyboard Shortcuts</Title>
				<ShortcutList>
					<ShortcutItem><ShortcutLabel>Undo</ShortcutLabel><Key>Cmd/Ctrl + Z</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Redo</ShortcutLabel><Key>Cmd/Ctrl + Shift + Z</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Save All</ShortcutLabel><Key>Cmd/Ctrl + S</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Open Directory</ShortcutLabel><Key>Cmd/Ctrl + O</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Extract Metadata</ShortcutLabel><Key>Cmd/Ctrl + E</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Mirror Files</ShortcutLabel><Key>Cmd/Ctrl + M</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Play/Pause</ShortcutLabel><Key>Space</Key></ShortcutItem>
					<ShortcutItem><ShortcutLabel>Stop</ShortcutLabel><Key>Enter</Key></ShortcutItem>
				</ShortcutList>
				<ButtonContainer>
					<CloseButton onClick={onClose}>Close</CloseButton>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
