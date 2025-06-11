import React from 'react';
import styled from '@emotion/styled';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
`;

const ModalContent = styled.div`
	background: rgba(40, 40, 50, 0.95);
	padding: 30px;
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	width: 90%;
	max-width: 500px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
`;

const Title = styled.h2`
	margin-top: 0;
	color: #e0e0e0;
	font-weight: 600;
	text-align: center;
	margin-bottom: 25px;
`;

const ShortcutList = styled.ul`
	list-style: none;
	padding: 0;
	color: #a0a0b0;
`;

const ShortcutItem = styled.li`
	display: flex;
	justify-content: space-between;
	padding: 10px 0;
	border-bottom: 1px solid #3a3a4a;
	&:last-child {
		border-bottom: none;
	}
`;

const Key = styled.kbd`
	background: #2a2a3a;
	padding: 4px 8px;
	border-radius: 4px;
	border: 1px solid #444;
	font-family: 'Courier New', Courier, monospace;
	color: #c0c0d0;
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 30px;
`;

const CloseButton = styled.button`
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-weight: 600;
	background: #4a4a5a;
	color: white;
	transition: background 0.2s;
	&:hover {
		background: #5a5a6a;
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
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<Title>Keyboard Shortcuts</Title>
				<ShortcutList>
					<ShortcutItem>
						<span>Undo</span>
						<Key>Cmd/Ctrl + Z</Key>
					</ShortcutItem>
					<ShortcutItem>
						<span>Redo</span>
						<Key>Cmd/Ctrl + Shift + Z</Key>
					</ShortcutItem>
					<ShortcutItem>
						<span>Save All</span>
						<Key>Cmd/Ctrl + S</Key>
					</ShortcutItem>
					<ShortcutItem>
						<span>Open Directory</span>
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
