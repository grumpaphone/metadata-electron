import React, { useState, useMemo } from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--modal-overlay);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000;
`;

const ModalContent = styled(VibrancyLayer)`
	padding: 30px;
	border-radius: 20px;
	border: 1px solid var(--border-primary);
	width: 90%;
	max-width: 600px;
	box-shadow: 0 28px 60px rgba(8, 16, 32, 0.45),
		inset 0 1px 0 rgba(255, 255, 255, 0.12);
`;

const Title = styled.h2`
	margin-top: 0;
	color: var(--text-primary);
	font-weight: 600;
	text-align: center;
`;

const Instructions = styled.p`
	color: var(--text-muted);
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
	background: rgba(255, 255, 255, 0.08);
	padding: 8px 12px;
	border-radius: 12px;
	color: var(--text-secondary);
	font-family: 'Courier New', Courier, monospace;
	flex: 1;
	text-align: center;
	border: 1px solid rgba(255, 255, 255, 0.12);
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15);
`;

const Select = styled.select`
	background: rgba(255, 255, 255, 0.08);
	color: var(--text-primary);
	border: 1px solid rgba(255, 255, 255, 0.16);
	border-radius: 10px;
	padding: 8px 12px;
	flex: 1;
	cursor: pointer;
	backdrop-filter: var(--glass-backdrop);
	&:focus {
		outline: none;
		border-color: rgba(140, 183, 255, 0.6);
	}

	option {
		background: rgba(14, 28, 56, 0.92);
		color: var(--text-primary);
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
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 12px;
	cursor: pointer;
	font-weight: 600;
	background: ${(props) =>
		props.primary
			? 'linear-gradient(145deg, rgba(82, 156, 255, 0.95) 0%, rgba(40, 116, 255, 0.92) 100%)'
			: 'linear-gradient(145deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.1) 100%)'};
	color: ${(props) => (props.primary ? '#ffffff' : 'var(--text-secondary)')};
	transition: all 0.2s ease;
	box-shadow: ${(props) =>
		props.primary
			? '0 12px 24px rgba(32, 78, 145, 0.28)'
			: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'};
	&:hover {
		background: ${(props) =>
			props.primary
				? 'linear-gradient(145deg, rgba(112, 178, 255, 0.98) 0%, rgba(56, 129, 255, 0.96) 100%)'
				: 'linear-gradient(145deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%)'};
		transform: translateY(-1px);
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
			<ModalContent intensity='strong'>
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
