import React, { useState, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';
import { useFocusTrap } from '../utils/useFocusTrap';
import { useModalKeyboard } from '../hooks/useModal';

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
	padding: 30px;
	width: 90%;
	max-width: 600px;
	box-shadow: var(--shadow-md);
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
	background: var(--fill-tertiary);
	padding: 8px 12px;
	border-radius: 6px;
	color: var(--text-secondary);
	font-family: 'Monaco', 'Menlo', monospace;
	flex: 1;
	text-align: center;
	border: 1px solid var(--border-secondary);
`;

const Select = styled.select`
	background: var(--input-bg);
	color: var(--text-primary);
	border: 1px solid var(--input-border);
	border-radius: 6px;
	padding: 8px 12px;
	flex: 1;
	cursor: pointer;
	&:focus { outline: none; border-color: var(--accent-primary); }
	option { background: var(--bg-tertiary); color: var(--text-primary); }
`;

const ButtonContainer = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 30px;
	gap: 10px;
`;

const Button = styled.button<{ primary?: boolean }>`
	padding: 10px 20px;
	border: 1px solid var(--border-secondary);
	border-radius: 6px;
	cursor: pointer;
	font-weight: 600;
	background: ${(props) => props.primary ? 'var(--accent-primary)' : 'var(--fill-tertiary)'};
	color: ${(props) => (props.primary ? '#ffffff' : 'var(--text-secondary)')};
	transition: all 0.2s ease;
	&:hover {
		opacity: 0.9;
	}
`;

const MAPPING_OPTIONS = ['ignore', 'show', 'category', 'subcategory', 'scene', 'slate', 'take'];

interface FilenameMappingModalProps {
	isOpen: boolean;
	onClose: () => void;
	onApply: (mapping: Record<number, string>) => void;
	sampleFilename: string;
}

export const FilenameMappingModal: React.FC<FilenameMappingModalProps> = ({
	isOpen, onClose, onApply, sampleFilename,
}) => {
	const filenameParts = useMemo(
		() => sampleFilename.replace(/\.wav$/i, '').split('_'),
		[sampleFilename]
	);

	const [mapping, setMapping] = useState<Record<number, string>>({});
	const trapRef = useFocusTrap(isOpen);
	useModalKeyboard(isOpen, onClose);

	// Reset mapping state each time the modal opens so stale values don't carry
	// between different files.
	useEffect(() => {
		if (isOpen) setMapping({});
	}, [isOpen]);

	const handleApply = () => {
		const hasAssignments = Object.values(mapping).some((v) => v && v !== 'ignore');
		if (hasAssignments) {
			const ok = window.confirm(
				'Applying this mapping will overwrite existing metadata values where fields are mapped. Continue?'
			);
			if (!ok) return;
		}
		onApply(mapping);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent ref={trapRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="filename-mapping-modal-title">
				<Title id="filename-mapping-modal-title">Map Filename Parts</Title>
				<Instructions>Assign each part of the filename to a metadata field.</Instructions>
				{filenameParts.map((part, index) => (
					<MappingRow key={index}>
						<FilenamePart>{part}</FilenamePart>
						<Select
							value={mapping[index] || 'ignore'}
							onChange={(e) => setMapping({ ...mapping, [index]: e.target.value })}>
							{MAPPING_OPTIONS.map((opt) => (
								<option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
							))}
						</Select>
					</MappingRow>
				))}
				<ButtonContainer>
					<Button onClick={onClose}>Cancel</Button>
					<Button onClick={handleApply} primary>Apply Mapping</Button>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
