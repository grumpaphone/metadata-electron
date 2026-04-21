import React, { useState, useCallback, useEffect, useMemo } from 'react';
import styled from '@emotion/styled';
import {
	MirrorConfiguration,
	MirrorOrganizeLevel,
	MirrorOrganizeField,
	Wavedata,
} from '../../types';
import type { MirrorResultWithCancel } from '../../ipc-api';
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
	border: 1px solid var(--border-primary);
	padding: 24px;
	width: 600px;
	max-height: 80vh;
	overflow-y: auto;
	color: var(--text-primary);
	box-shadow: var(--shadow-md);
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	border-bottom: 1px solid var(--border-secondary);
	padding-bottom: 16px;
`;

const Title = styled.h2`
	margin: 0;
	color: var(--text-primary);
	font-size: 20px;
	font-weight: 600;
`;

const CloseButton = styled.button`
	background: transparent;
	border: 1px solid transparent;
	color: var(--text-muted);
	font-size: 24px;
	cursor: pointer;
	width: 32px; height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	transition: all 0.2s ease;
	&:hover { background: var(--fill-tertiary); color: var(--accent-primary); }
`;

const Section = styled.div`
	margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 500;
	color: var(--text-secondary);
`;

const PathSelector = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 16px;
`;

const PathInput = styled.input`
	flex: 1;
	background: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	padding: 10px 14px;
	border-radius: 6px;
	font-size: 14px;
	&:focus { outline: none; border-color: var(--accent-primary); }
	&:read-only { background: var(--fill-tertiary); color: var(--text-muted); cursor: not-allowed; }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	background: ${(props) =>
		props.variant === 'danger' ? 'var(--color-error)'
		: props.variant === 'secondary' ? 'var(--fill-tertiary)'
		: 'var(--accent-primary)'};
	color: ${(props) => props.variant === 'secondary' ? 'var(--text-secondary)' : '#fff'};
	border: 1px solid var(--border-secondary);
	padding: 8px 16px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;
	&:hover {
		opacity: 0.9;
	}
	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
`;

const OrganizeLevel = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 8px;
	padding: 12px;
	background: var(--fill-tertiary);
	border-radius: 8px;
	border: 1px solid var(--border-secondary);
`;

const Select = styled.select`
	background: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 14px;
	min-width: 140px;
	&:focus { outline: none; border-color: var(--accent-primary); }
	option { background: var(--bg-tertiary); color: var(--text-primary); }
`;

const LevelNumber = styled.div`
	background: var(--accent-primary);
	color: #fff;
	width: 24px; height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 600;
	flex-shrink: 0;
`;

const ModalFooter = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
	padding-top: 16px;
	border-top: 1px solid var(--border-secondary);
`;

const FileCountInfo = styled.div`
	font-size: 14px;
	color: var(--text-muted);
	margin-bottom: 16px;
`;

const PreviewPath = styled.div`
	background: var(--fill-tertiary);
	border: 1px solid var(--border-secondary);
	border-radius: 8px;
	padding: 12px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	color: var(--text-secondary);
	margin-top: 8px;
	word-break: break-all;
`;

const ResultSection = styled.div`
	margin-top: 16px;
	padding: 16px;
	border-radius: 8px;
	background: var(--fill-tertiary);
	border: 1px solid var(--border-secondary);
`;

const ORGANIZE_FIELDS: Array<{ value: MirrorOrganizeField; label: string }> = [
	{ value: 'show', label: 'Show' },
	{ value: 'scene', label: 'Scene' },
	{ value: 'category', label: 'Category' },
	{ value: 'subcategory', label: 'Subcategory' },
	{ value: 'take', label: 'Take' },
];

interface MirrorModalProps {
	isOpen: boolean;
	onClose: () => void;
	selectedFiles: string[];
	allFiles: Wavedata[];
	totalFiles: number;
}

export const MirrorModal: React.FC<MirrorModalProps> = ({
	isOpen, onClose, selectedFiles, allFiles, totalFiles,
}) => {
	const [destinationPath, setDestinationPath] = useState('');
	const [organizeLevels, setOrganizeLevels] = useState<MirrorOrganizeLevel[]>([{ field: 'show', order: 0 }]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isCancelling, setIsCancelling] = useState(false);
	const [result, setResult] = useState<MirrorResultWithCancel | null>(null);
	const opIdRef = React.useRef<string | null>(null);

	const api = window.electronAPI;

	useEffect(() => {
		if (!isOpen) {
			setDestinationPath('');
			setOrganizeLevels([{ field: 'show', order: 0 }]);
			setIsProcessing(false);
			setIsCancelling(false);
			setResult(null);
			opIdRef.current = null;
		}
	}, [isOpen]);

	const handleSelectDestination = useCallback(async () => {
		try {
			const path = await api.selectMirrorDestination();
			if (path) setDestinationPath(path);
		} catch (error) {
			console.error('Failed to select destination:', error);
		}
	}, [api]);

	const handleAddLevel = useCallback(() => {
		if (organizeLevels.length >= 4) return;
		const usedFields = new Set(organizeLevels.map((l) => l.field));
		const available = ORGANIZE_FIELDS.find((f) => !usedFields.has(f.value));
		if (available) {
			setOrganizeLevels((prev) => [...prev, { field: available.value, order: prev.length }]);
		}
	}, [organizeLevels]);

	const handleRemoveLevel = useCallback((index: number) => {
		setOrganizeLevels((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })));
	}, []);

	const handleChangeField = useCallback((index: number, field: MirrorOrganizeField) => {
		setOrganizeLevels((prev) => prev.map((l, i) => (i === index ? { ...l, field } : l)));
	}, []);

	const previewPath = useMemo(() => {
		if (!destinationPath || organizeLevels.length === 0) return '';
		const example = selectedFiles.length > 0
			? allFiles.find((f) => f.filePath === selectedFiles[0])
			: allFiles[0];
		if (!example) return '';
		let p = destinationPath;
		for (const level of organizeLevels) {
			p += `/${example[level.field as keyof Wavedata] || 'Misc'}`;
		}
		return `${p}/${example.filename}`;
	}, [destinationPath, organizeLevels, selectedFiles, allFiles]);

	const handleMirror = useCallback(async () => {
		if (!destinationPath || organizeLevels.length === 0) return;
		setIsProcessing(true);
		setIsCancelling(false);
		setResult(null);
		const opId =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto
				? crypto.randomUUID()
				: `mirror-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		opIdRef.current = opId;
		try {
			const config: MirrorConfiguration = {
				destinationPath,
				organizeLevels,
				selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
			};
			// Pre-flight conflict check
			const conflicts = await api.checkFileConflicts(config, allFiles);
			if (conflicts.length > 0) {
				const proceed = window.confirm(
					`${conflicts.length} file${conflicts.length === 1 ? '' : 's'} already exist at the destination. Continue and skip them?`
				);
				if (!proceed) {
					setIsProcessing(false);
					return;
				}
			}
			const mirrorResult = await api.mirrorFiles(config, allFiles, opId);
			setResult(mirrorResult);
		} catch (error) {
			setResult({
				success: false, copiedFiles: 0,
				errors: [{ filePath: 'GENERAL', error: String(error) }],
				conflicts: [],
			});
		} finally {
			setIsProcessing(false);
			setIsCancelling(false);
			opIdRef.current = null;
		}
	}, [destinationPath, organizeLevels, selectedFiles, allFiles, api]);

	const handleCancelMirror = useCallback(async () => {
		const opId = opIdRef.current;
		if (!opId || isCancelling) return;
		setIsCancelling(true);
		try {
			await api.cancelMirror(opId);
		} catch (error) {
			console.error('Failed to request mirror cancellation:', error);
		}
	}, [api, isCancelling]);

	const trapRef = useFocusTrap(isOpen);
	// Escape while processing asks the user to confirm cancelling the
	// in-flight mirror; the modal stays open until the mirrorFiles promise
	// resolves with `cancelled: true`, at which point the user can close.
	const escGuard = useCallback(() => {
		if (!isProcessing) return true;
		const proceed = window.confirm('Cancel mirror in progress?');
		if (proceed) {
			void handleCancelMirror();
		}
		return false;
	}, [isProcessing, handleCancelMirror]);
	useModalKeyboard(isOpen, onClose, escGuard);

	if (!isOpen) return null;

	const usedFields = new Set(organizeLevels.map((l) => l.field));
	const canAddLevel = organizeLevels.length < 4 && ORGANIZE_FIELDS.some((f) => !usedFields.has(f.value));

	return (
		<ModalOverlay onClick={() => { if (!isProcessing) onClose(); }}>
			<ModalContent ref={trapRef} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="mirror-modal-title">
				<ModalHeader>
					<Title id="mirror-modal-title">Mirror Files</Title>
					<CloseButton onClick={onClose} disabled={isProcessing} aria-label="Close">×</CloseButton>
				</ModalHeader>

				<FileCountInfo>
					{selectedFiles.length > 0 ? `Mirroring ${selectedFiles.length} selected files` : `Mirroring all ${totalFiles} files`}
				</FileCountInfo>

				<Section>
					<SectionTitle>Destination Directory</SectionTitle>
					<PathSelector>
						<PathInput value={destinationPath} placeholder="Select destination directory..." readOnly />
						<Button onClick={handleSelectDestination}>Browse</Button>
					</PathSelector>
				</Section>

				<Section>
					<SectionTitle>Folder Organization</SectionTitle>
					{organizeLevels.map((level, index) => (
						<OrganizeLevel key={index}>
							<LevelNumber>{index + 1}</LevelNumber>
							<Select value={level.field} onChange={(e) => handleChangeField(index, e.target.value as MirrorOrganizeField)}>
								{ORGANIZE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
							</Select>
							{organizeLevels.length > 1 && <Button variant="danger" onClick={() => handleRemoveLevel(index)}>Remove</Button>}
						</OrganizeLevel>
					))}
					{canAddLevel && <Button onClick={handleAddLevel} style={{ marginTop: '8px' }}>+ Add Level</Button>}
					{previewPath && (
						<div>
							<SectionTitle style={{ marginTop: '16px', marginBottom: '8px' }}>Preview Path:</SectionTitle>
							<PreviewPath>{previewPath}</PreviewPath>
						</div>
					)}
				</Section>

				{result && (
					<ResultSection>
						{result.cancelled ? (
							<div style={{ color: 'var(--color-warning)', fontWeight: 500 }}>
								Cancelled. {result.copiedFiles} file{result.copiedFiles === 1 ? '' : 's'} copied, {result.conflicts.length} skipped.
							</div>
						) : result.success ? (
							<div style={{ color: 'var(--color-success)', fontWeight: 500 }}>Mirror completed! Copied {result.copiedFiles} files.</div>
						) : (
							<div style={{ color: 'var(--color-error)', fontWeight: 500 }}>Mirror failed with {result.errors.length} errors.</div>
						)}
						{!result.cancelled && result.conflicts.length > 0 && (
							<div style={{ color: 'var(--color-warning)', fontWeight: 500, marginTop: '8px' }}>
								{result.conflicts.length} files skipped due to conflicts.
							</div>
						)}
						{result.errors.length > 0 && (
							<ul style={{ color: 'var(--color-error)', fontSize: '13px', paddingLeft: '20px' }}>
								{result.errors.map((err, i) => <li key={i}>{err.filePath}: {err.error}</li>)}
							</ul>
						)}
					</ResultSection>
				)}

				<ModalFooter>
					<Button variant="secondary" onClick={onClose} disabled={isProcessing && !isCancelling}>{result ? 'Close' : 'Cancel'}</Button>
					{!result && (
						isProcessing ? (
							<Button variant="danger" onClick={handleCancelMirror} disabled={isCancelling}>
								{isCancelling ? 'Cancelling...' : 'Cancel Mirror'}
							</Button>
						) : (
							<Button onClick={handleMirror} disabled={!destinationPath || organizeLevels.length === 0}>
								Start Mirror
							</Button>
						)
					)}
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
