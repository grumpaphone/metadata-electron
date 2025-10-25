import React from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const ModalOverlay = styled.div`
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

const ModalContent = styled(VibrancyLayer)`
	padding: 28px;
	border-radius: 18px;
	border: 1px solid var(--border-primary);
	width: 90%;
	max-width: 500px;
	box-shadow: 0 24px 48px rgba(12, 22, 43, 0.38),
		inset 0 1px 0 rgba(255, 255, 255, 0.12);
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
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);

	&:last-child {
		border-bottom: none;
	}
`;

const ShortcutLabel = styled.span`
	font-size: 14px;
`;

const Key = styled.kbd`
	background: rgba(255, 255, 255, 0.14);
	padding: 6px 10px;
	border-radius: 10px;
	border: 1px solid rgba(255, 255, 255, 0.18);
	font-family: 'Courier New', Courier, monospace;
	color: var(--text-primary);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 24px;
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

interface KeyboardShortcutsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
	isOpen,
	onClose,
}) => {
	if (!isOpen) {
		return null;
	}

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent intensity='strong' onClick={(e) => e.stopPropagation()}>
				<Title>Keyboard Shortcuts</Title>
				<ShortcutList>
					<ShortcutItem>
						<ShortcutLabel>Undo</ShortcutLabel>
						<Key>Cmd/Ctrl + Z</Key>
					</ShortcutItem>
					<ShortcutItem>
						<ShortcutLabel>Redo</ShortcutLabel>
						<Key>Cmd/Ctrl + Shift + Z</Key>
					</ShortcutItem>
					<ShortcutItem>
						<ShortcutLabel>Save All</ShortcutLabel>
						<Key>Cmd/Ctrl + S</Key>
					</ShortcutItem>
					<ShortcutItem>
						<ShortcutLabel>Open Directory</ShortcutLabel>
						<Key>Cmd/Ctrl + O</Key>
					</ShortcutItem>
				</ShortcutList>
				<ButtonContainer>
					<CloseButton onClick={onClose}>Close</CloseButton>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
