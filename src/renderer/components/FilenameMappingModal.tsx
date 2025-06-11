import React, { useState, useMemo } from 'react';
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
	max-width: 600px;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(10px);
`;

const Title = styled.h2`
	margin-top: 0;
	color: #e0e0e0;
	font-weight: 600;
	text-align: center;
`;

const Instructions = styled.p`
	color: #a0a0b0;
	text-align: center;
	margin-bottom: 25px;
`;

const MappingRow = styled.div`
	display: flex;
	align-items: center;
	margin-bottom: 15px;
	gap: 15px;
`;

const FilenamePart = styled.span`
	background: #2a2a3a;
	padding: 8px 12px;
	border-radius: 6px;
	color: #c0c0d0;
	font-family: 'Courier New', Courier, monospace;
	flex: 1;
	text-align: center;
`;

const Select = styled.select`
	background: #1e1e2e;
	color: #e0e0e0;
	border: 1px solid #444;
	border-radius: 6px;
	padding: 8px 12px;
	flex: 1;
	cursor: pointer;
	&:focus {
		outline: none;
		border-color: #7f5af0;
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 30px;
	gap: 10px;
`;

const Button = styled.button<{ primary?: boolean }>`
	padding: 10px 20px;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	font-weight: 600;
	background: ${(props) => (props.primary ? '#7F5AF0' : '#4a4a5a')};
	color: white;
	transition: background 0.2s;
	&:hover {
		background: ${(props) => (props.primary ? '#9470f3' : '#5a5a6a')};
	}
`;

const MAPPING_OPTIONS = [
	'ignore',
	'show',
	'category',
	'subcategory',
	'scene',
	'slate',
	'take',
];

interface FilenameMappingModalProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (mapping: Record<number, string>) => void;
	sampleFilename: string;
}

export const FilenameMappingModal: React.FC<FilenameMappingModalProps> = ({
	isOpen,
	onClose,
	onApply,
	sampleFilename,
}) => {
	const filenameParts = useMemo(
		() => sampleFilename.replace(/\.wav$/i, '').split('_'),
		[sampleFilename]
	);

	const [mapping, setMapping] = useState<Record<number, string>>({});

	if (!isOpen) {
		return null;
	}

	const handleApply = () => {
		onApply(mapping);
		onClose();
	};

	return (
		<ModalOverlay>
			<ModalContent>
				<Title>Map Filename Parts</Title>
				<Instructions>
					Assign each part of the filename to a metadata field.
				</Instructions>
				{filenameParts.map((part, index) => (
					<MappingRow key={index}>
						<FilenamePart>{part}</FilenamePart>
						<Select
							value={mapping[index] || 'ignore'}
							onChange={(e) =>
								setMapping({
									...mapping,
									[index]: e.target.value,
								})
							}>
							{MAPPING_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>
									{opt.charAt(0).toUpperCase() + opt.slice(1)}
								</option>
							))}
						</Select>
					</MappingRow>
				))}
				<ButtonContainer>
					<Button onClick={onClose}>Cancel</Button>
					<Button onClick={handleApply} primary>
						Apply Mapping
					</Button>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
