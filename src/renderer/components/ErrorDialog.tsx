import React from 'react';
import styled from '@emotion/styled';

const DialogOverlay = styled.div`
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

const DialogContent = styled.div`
	background: rgba(40, 40, 50, 0.95);
	padding: 30px;
	border-radius: 12px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	width: 90%;
	max-width: 400px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
	text-align: center;
	color: #e0e0e0;
`;

const Title = styled.h2`
	margin-top: 0;
	color: #ff6b6b;
	font-weight: 600;
`;

const Message = styled.p`
	color: #a0a0b0;
	margin-bottom: 25px;
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
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<Title>Error</Title>
				<Message>{message}</Message>
				<CloseButton onClick={onClose}>Close</CloseButton>
			</DialogContent>
		</DialogOverlay>
	);
};
