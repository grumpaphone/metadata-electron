import React, { useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import {
	MirrorConfiguration,
	MirrorOrganizeLevel,
	MirrorOrganizeField,
	MirrorResult,
} from '../../types';

// Styled Components
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
	background: rgba(30, 30, 40, 0.95);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	padding: 24px;
	width: 600px;
	max-height: 80vh;
	overflow-y: auto;
	color: #eee;
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	padding-bottom: 16px;
`;

const Title = styled.h2`
	margin: 0;
	color: #fff;
	font-size: 20px;
	font-weight: 600;
`;

const CloseButton = styled.button`
	background: transparent;
	border: none;
	color: #ccc;
	font-size: 24px;
	cursor: pointer;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 4px;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}
`;

const Section = styled.div`
	margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 16px;
	font-weight: 500;
	color: #fff;
`;

const PathSelector = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 16px;
`;

const PathInput = styled.input`
	flex: 1;
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #eee;
	padding: 10px 12px;
	border-radius: 6px;
	font-size: 14px;

	&:focus {
		outline: none;
		border-color: #007aff;
	}

	&:read-only {
		background: rgba(0, 0, 0, 0.1);
		color: #999;
		cursor: not-allowed;
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
	background: ${(props) =>
		props.variant === 'danger'
			? '#dc3545'
			: props.variant === 'secondary'
			? 'transparent'
			: '#007aff'};
	color: white;
	border: ${(props) =>
		props.variant === 'secondary'
			? '1px solid rgba(255, 255, 255, 0.2)'
			: 'none'};
	padding: 8px 16px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) =>
			props.variant === 'danger'
				? '#c82333'
				: props.variant === 'secondary'
				? 'rgba(255, 255, 255, 0.1)'
				: '#0056b3'};
	}

	&:disabled {
		background: #444;
		color: #888;
		cursor: not-allowed;
	}
`;

const OrganizeLevel = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	margin-bottom: 8px;
	padding: 12px;
	background: rgba(0, 0, 0, 0.2);
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Select = styled.select`
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #eee;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 14px;
	min-width: 140px;

	&:focus {
		outline: none;
		border-color: #007aff;
	}

	option {
		background: #333;
		color: #eee;
	}
`;

const LevelNumber = styled.div`
	background: #007aff;
	color: white;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 600;
	flex-shrink: 0;
`;

const AddLevelButton = styled(Button)`
	align-self: flex-start;
	margin-top: 8px;
`;

const ModalFooter = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
	padding-top: 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const FileCountInfo = styled.div`
	font-size: 14px;
	color: #ccc;
	margin-bottom: 16px;
`;

const PreviewPath = styled.div`
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 6px;
	padding: 12px;
	font-family: 'Monaco', 'Menlo', monospace;
	font-size: 12px;
	color: #ccc;
	margin-top: 8px;
	word-break: break-all;
`;

const ResultSection = styled.div`
	margin-top: 16px;
	padding: 16px;
	border-radius: 8px;
	background: rgba(0, 0, 0, 0.2);
`;

const SuccessMessage = styled.div`
	color: #28a745;
	font-weight: 500;
	margin-bottom: 8px;
`;

const ErrorMessage = styled.div`
	color: #dc3545;
	font-weight: 500;
	margin-bottom: 8px;
`;

const ErrorList = styled.ul`
	margin: 8px 0;
	padding-left: 20px;
	color: #ff6b6b;
	font-size: 13px;
`;

// Field Options
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
	allFiles: any[]; // Wavedata[] but avoiding import issues
	totalFiles: number;
}

export const MirrorModal: React.FC<MirrorModalProps> = ({
	isOpen,
	onClose,
	selectedFiles,
	allFiles,
	totalFiles,
}) => {
	const [destinationPath, setDestinationPath] = useState('');
	const [organizeLevels, setOrganizeLevels] = useState<MirrorOrganizeLevel[]>([
		{ field: 'show', order: 0 },
	]);
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<MirrorResult | null>(null);

	const api = window.electronAPI;

	// Reset state when modal opens/closes
	useEffect(() => {
		if (!isOpen) {
			setDestinationPath('');
			setOrganizeLevels([{ field: 'show', order: 0 }]);
			setIsProcessing(false);
			setResult(null);
		}
	}, [isOpen]);

	const handleSelectDestination = useCallback(async () => {
		try {
			const path = await api.selectMirrorDestination();
			if (path) {
				setDestinationPath(path);
			}
		} catch (error) {
			console.error('Failed to select destination:', error);
		}
	}, [api]);

	const handleAddLevel = useCallback(() => {
		if (organizeLevels.length >= 4) return;

		const usedFields = new Set(organizeLevels.map((l) => l.field));
		const availableField = ORGANIZE_FIELDS.find(
			(f) => !usedFields.has(f.value)
		);

		if (availableField) {
			setOrganizeLevels((prev) => [
				...prev,
				{ field: availableField.value, order: prev.length },
			]);
		}
	}, [organizeLevels]);

	const handleRemoveLevel = useCallback((index: number) => {
		setOrganizeLevels((prev) =>
			prev
				.filter((_, i) => i !== index)
				.map((level, i) => ({ ...level, order: i }))
		);
	}, []);

	const handleChangeField = useCallback(
		(index: number, field: MirrorOrganizeField) => {
			setOrganizeLevels((prev) =>
				prev.map((level, i) => (i === index ? { ...level, field } : level))
			);
		},
		[]
	);

	const generatePreviewPath = useCallback(() => {
		if (!destinationPath || organizeLevels.length === 0) return '';

		// Use the first file as an example
		const exampleFile =
			selectedFiles.length > 0
				? allFiles.find((f) => f.filePath === selectedFiles[0])
				: allFiles[0];

		if (!exampleFile) return '';

		let path = destinationPath;
		for (const level of organizeLevels) {
			const value = exampleFile[level.field] || 'Misc';
			path += `/${value}`;
		}
		return `${path}/${exampleFile.filename}`;
	}, [destinationPath, organizeLevels, selectedFiles, allFiles]);

	const handleMirror = useCallback(async () => {
		if (!destinationPath || organizeLevels.length === 0) return;

		setIsProcessing(true);
		setResult(null);

		try {
			// First, update the main process with current files
			await api.setCurrentFiles(allFiles);

			const config: MirrorConfiguration = {
				destinationPath,
				organizeLevels,
				selectedFiles: selectedFiles.length > 0 ? selectedFiles : undefined,
			};

			console.log('[MIRROR] Starting mirror with config:', config);
			const mirrorResult = await api.mirrorFiles(config);
			setResult(mirrorResult);
		} catch (error) {
			console.error('Mirror operation failed:', error);
			setResult({
				success: false,
				copiedFiles: 0,
				errors: [{ filePath: 'GENERAL', error: String(error) }],
				conflicts: [],
			});
		} finally {
			setIsProcessing(false);
		}
	}, [destinationPath, organizeLevels, selectedFiles, allFiles, api]);

	if (!isOpen) return null;

	const filesToProcess =
		selectedFiles.length > 0 ? selectedFiles.length : totalFiles;
	const usedFields = new Set(organizeLevels.map((l) => l.field));
	const canAddLevel =
		organizeLevels.length < 4 &&
		ORGANIZE_FIELDS.some((f) => !usedFields.has(f.value));

	return (
		<ModalOverlay onClick={onClose}>
			<ModalContent onClick={(e) => e.stopPropagation()}>
				<ModalHeader>
					<Title>Mirror Files</Title>
					<CloseButton onClick={onClose}>×</CloseButton>
				</ModalHeader>

				<FileCountInfo>
					{selectedFiles.length > 0
						? `Mirroring ${selectedFiles.length} selected files`
						: `Mirroring all ${totalFiles} files`}
				</FileCountInfo>

				<Section>
					<SectionTitle>Destination Directory</SectionTitle>
					<PathSelector>
						<PathInput
							value={destinationPath}
							placeholder='Select destination directory...'
							readOnly
						/>
						<Button onClick={handleSelectDestination}>Browse</Button>
					</PathSelector>
				</Section>

				<Section>
					<SectionTitle>Folder Organization</SectionTitle>
					{organizeLevels.map((level, index) => (
						<OrganizeLevel key={index}>
							<LevelNumber>{index + 1}</LevelNumber>
							<Select
								value={level.field}
								onChange={(e) =>
									handleChangeField(
										index,
										e.target.value as MirrorOrganizeField
									)
								}>
								{ORGANIZE_FIELDS.map((field) => (
									<option key={field.value} value={field.value}>
										{field.label}
									</option>
								))}
							</Select>
							{organizeLevels.length > 1 && (
								<Button
									variant='danger'
									onClick={() => handleRemoveLevel(index)}>
									Remove
								</Button>
							)}
						</OrganizeLevel>
					))}
					{canAddLevel && (
						<AddLevelButton onClick={handleAddLevel}>
							+ Add Level
						</AddLevelButton>
					)}

					{generatePreviewPath() && (
						<div>
							<SectionTitle style={{ marginTop: '16px', marginBottom: '8px' }}>
								Preview Path (example):
							</SectionTitle>
							<PreviewPath>{generatePreviewPath()}</PreviewPath>
						</div>
					)}
				</Section>

				{result && (
					<ResultSection>
						{result.success ? (
							<SuccessMessage>
								✅ Mirror completed successfully! Copied {result.copiedFiles}{' '}
								files.
							</SuccessMessage>
						) : (
							<ErrorMessage>
								❌ Mirror failed with {result.errors.length} errors.
							</ErrorMessage>
						)}

						{result.conflicts.length > 0 && (
							<div>
								<div
									style={{
										color: '#ffc107',
										fontWeight: 500,
										marginTop: '8px',
									}}>
									⚠️ {result.conflicts.length} files were skipped due to
									conflicts:
								</div>
								<ErrorList>
									{result.conflicts.map((conflict, i) => (
										<li key={i}>{conflict.sourcePath}</li>
									))}
								</ErrorList>
							</div>
						)}

						{result.errors.length > 0 && (
							<div>
								<div
									style={{
										color: '#dc3545',
										fontWeight: 500,
										marginTop: '8px',
									}}>
									Errors:
								</div>
								<ErrorList>
									{result.errors.map((error, i) => (
										<li key={i}>
											{error.filePath}: {error.error}
										</li>
									))}
								</ErrorList>
							</div>
						)}
					</ResultSection>
				)}

				<ModalFooter>
					<Button variant='secondary' onClick={onClose}>
						{result ? 'Close' : 'Cancel'}
					</Button>
					{!result && (
						<Button
							onClick={handleMirror}
							disabled={
								!destinationPath || organizeLevels.length === 0 || isProcessing
							}>
							{isProcessing ? 'Processing...' : 'Start Mirror'}
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</ModalOverlay>
	);
};
