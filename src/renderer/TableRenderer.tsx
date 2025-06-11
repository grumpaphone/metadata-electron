import React, {
	useEffect,
	useMemo,
	useState,
	useRef,
	useCallback,
} from 'react';
import styled from '@emotion/styled';
import { Global } from '@emotion/react';
import { shallow } from 'zustand/shallow';
import { useStore, AppState } from './store';
import { Wavedata, BWFMetadata, AgentStatus } from '../types';

import { ErrorDialog } from './components/ErrorDialog';
import { FilenameMappingModal } from './components/FilenameMappingModal';
import { AudioPlayer } from './components/AudioPlayer';
import { MirrorModal } from './components/MirrorModal';

// --- UTILITIES ---
const basename = (path: string) => path.split(/[\\/]/).pop() || '';

const createFallbackAPI = () => {
	console.warn('Fallback API created. IPC is not available.');
	const a = () => {
		/* no-op */
	};
	const p = () => Promise.resolve(undefined);
	return {
		onProgressUpdate: a,
		onAgentStatusChange: a,
		onAutoSaveRequest: a,
		showOpenDialog: () =>
			Promise.resolve({ canceled: true, filePaths: [] as string[] }),
		scanDirectory: () => Promise.resolve([] as Wavedata[]),
		checkIsDirectory: () => Promise.resolve(false),
		readMetadata: () => Promise.resolve(null as unknown as Wavedata),
		writeMetadata: p,
		writeAllMetadata: p,
		loadAudioFile: p,
		removeAllListeners: a,
	};
};

// --- STYLED COMPONENTS ---

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: linear-gradient(
		135deg,
		rgba(30, 30, 40, 0.95) 0%,
		rgba(20, 20, 30, 0.98) 100%
	);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #e0e0e0;
	font-family: 'Inter', sans-serif;

	&.dragging {
		border: 2px dashed #007bff;
	}
`;

const TitleBar = styled.div`
	height: 30px;
	width: 100%;
	-webkit-app-region: drag;
	position: fixed;
	top: 0;
	left: 0;
	z-index: 100;
`;

const GlobalStyles = () => (
	<Global
		styles={`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
      body, html {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
    `}
	/>
);

const Button = styled.button`
	background: #007aff;
	color: white;
	border: none;
	padding: 10px 15px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: background 0.2s ease;
	&:hover {
		background: #0056b3;
	}
	&:disabled {
		background: #444;
		color: #888;
		cursor: not-allowed;
	}
`;

const Spinner = styled.div`
	border: 4px solid rgba(255, 255, 255, 0.3);
	border-radius: 50%;
	border-top: 4px solid #fff;
	width: 40px;
	height: 40px;
	animation: spin 1s linear infinite;
	position: fixed;
	top: 50%;
	left: 50%;
	margin-left: -20px;
	margin-top: -20px;
	z-index: 1001;

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
`;

const ToolBar = styled.div`
	display: flex;
	padding: 8px;
	padding-top: 40px; /* Space for the draggable title bar */
	background: transparent;
	gap: 8px;
	align-items: center;
`;

const Input = styled.input`
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #eee;
	padding: 10px 15px;
	border-radius: 6px;
	font-size: 14px;
	transition: border-color 0.2s ease;

	&:focus {
		outline: none;
		border-color: #007aff;
	}
`;

const DropdownItem = styled.div`
	padding: 8px 12px;
	cursor: pointer;
	&:hover {
		background: #007bff;
	}
`;

const TableContainer = styled.div`
	flex-grow: 1;
	overflow: auto;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
`;

const TableHeader = styled.th`
	background: #333;
	padding: 10px;
	text-align: left;
	cursor: pointer;
	position: sticky;
	top: 0;
	user-select: none;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
	background: ${(props) => (props.selected ? '#007bff40' : 'transparent')};
	border-bottom: 1px solid #444;
	&:hover {
		background: #ffffff1a;
	}
`;

const TableCell = styled.td`
	padding: 10px;
	border-right: 1px solid #444;
	&:last-child {
		border-right: none;
	}
`;

const StatusBar = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 4px 8px;
	background: #2a2a2a;
	border-top: 1px solid #444;
	font-size: 12px;
`;

const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: #888;
`;

const EditableCellInput = styled(Input)`
	width: 100%;
	box-sizing: border-box;
	background: transparent;
	border: 1px solid transparent;
	padding: 0;
	margin: 0;
	height: 100%;

	&:focus {
		background: #111;
		border-color: #007bff;
	}
`;

const DirtyIndicator = styled.div`
	width: 6px;
	height: 6px;
	background-color: #ffc107;
	border-radius: 50%;
	position: absolute;
	top: 4px;
	right: 4px;
`;

const CellContainer = styled.div`
	position: relative;
	padding-right: 12px;
`;

const FilterButton = styled.button`
	position: absolute;
	left: 4px;
	top: 50%;
	transform: translateY(-50%);
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: white;
	padding: 6px 10px;
	border-radius: 4px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	transition: background 0.2s ease;
	height: calc(100% - 8px);

	&:hover {
		background: rgba(255, 255, 255, 0.1);
	}
`;

const SearchContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 300px;
`;

const SearchInput = styled(Input)`
	padding-left: 90px;
	width: 100%;
	box-sizing: border-box;
`;

const DropdownMenu = styled.div`
	position: absolute;
	top: 110%;
	left: 0;
	background: #333;
	border: 1px solid #555;
	border-radius: 4px;
	z-index: 100;
	min-width: 120px;
`;

// --- CHILD COMPONENTS ---

interface EditableCellProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const EditableCell: React.FC<EditableCellProps> = ({ value, onChange }) => (
	<EditableCellInput type='text' value={value} onChange={onChange} />
);

const EDITABLE_FIELDS = ['show', 'scene', 'take', 'ixmlNote'] as const;

// --- MAIN APP COMPONENT ---

export const App: React.FC = () => {
	console.log('[RENDERER-INFO] App component starting...');

	// --- State Selectors ---
	const {
		filteredFiles,
		isLoading,
		error,
		loadingProgress,
		searchText,
		searchField,
		selectedRows,
		files,
		originalFiles,
		isDirty,
	} = useStore(
		(state: AppState) => ({
			filteredFiles: state.filteredFiles,
			isLoading: state.isLoading,
			error: state.error,
			loadingProgress: state.loadingProgress,
			searchText: state.searchText,
			searchField: state.searchField,
			selectedRows: state.selectedRows,
			files: state.files,
			originalFiles: state.originalFiles,
			isDirty: state.isDirty,
		}),
		shallow
	);

	const { isPlaying, currentFile } = useStore(
		(state: AppState) => ({
			isPlaying: state.audioPlayer.isPlaying,
			currentFile: state.audioPlayer.currentFile,
		}),
		shallow
	);

	// --- Actions (via getState to avoid re-renders) ---
	const storeActions = useStore.getState();

	// --- Component State ---
	const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
	const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Wavedata;
		direction: 'asc' | 'desc';
	} | null>({ key: 'filename', direction: 'asc' });
	const [isFilterOpen, setFilterOpen] = useState(false);
	const filterContainerRef = useRef<HTMLDivElement>(null);

	const api = window.electronAPI || createFallbackAPI();

	const searchOptions = [
		{ value: 'filename', label: 'Filename' },
		{ value: 'show', label: 'Show' },
		{ value: 'scene', label: 'Scene' },
		{ value: 'take', label: 'Take' },
		{ value: 'ixmlNote', label: 'Note' },
	];

	// --- Memos & Effects ---
	const sortedFiles = useMemo(() => {
		if (!sortConfig) return filteredFiles;

		return [...filteredFiles].sort((a, b) => {
			const aValue = a[sortConfig.key as keyof Wavedata] as any;
			const bValue = b[sortConfig.key as keyof Wavedata] as any;

			if (aValue < bValue) {
				return sortConfig.direction === 'asc' ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === 'asc' ? 1 : -1;
			}
			return 0;
		});
	}, [filteredFiles, sortConfig]);

	useEffect(() => {
		const handleProgress = (data: {
			fileName: string;
			percentage: number;
			processed: number;
			total: number;
		}) => {
			storeActions.setLoadingProgress(data);
		};
		const handleStatusChange = (statuses: AgentStatus[]) => {
			storeActions.setAgentStatuses(statuses);
		};
		const handleAutoSave = () => {
			console.log('Auto-save triggered by main process.');
			storeActions.saveAllChanges();
		};

		api.onProgressUpdate(handleProgress);
		api.onAgentStatusChange(handleStatusChange);
		api.onAutoSaveRequest(handleAutoSave);

		return () => {
			api.removeAllListeners('progress-update');
			api.removeAllListeners('agent-status-change');
			api.removeAllListeners('auto-save-request');
		};
	}, [api, storeActions]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
				e.preventDefault();
				e.shiftKey ? storeActions.redo() : storeActions.undo();
			}
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				storeActions.saveAllChanges();
			}
		},
		[storeActions]
	);

	useEffect(() => {
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				filterContainerRef.current &&
				!filterContainerRef.current.contains(event.target as Node)
			) {
				setFilterOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// --- Handlers ---
	const handleEmbed = () => storeActions.saveAllChanges();
	const handleSort = (key: keyof Wavedata) => {
		setSortConfig((current) => ({
			key,
			direction:
				current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	};

	const renderSortIndicator = (key: keyof Wavedata) => {
		if (sortConfig?.key !== key) return ' ↕';
		return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
	};

	const handleOpenDirectory = async () => {
		const result = await api.showOpenDialog();
		if (result && !result.canceled && result.filePaths.length > 0) {
			loadFilesFromDirectory(result.filePaths[0]);
		}
	};

	const loadFilesFromDirectory = async (dirPath: string) => {
		try {
			storeActions.setIsLoading(true);
			const loadedFiles = await api.scanDirectory(dirPath);
			storeActions.setFiles(loadedFiles);
		} catch (err) {
			storeActions.setError(
				`Failed to load directory: ${(err as Error).message}`
			);
		} finally {
			storeActions.setIsLoading(false);
		}
	};

	const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
		storeActions.setIsLoading(true);

		try {
			const droppedItems = Array.from(e.dataTransfer.files);
			const filesToAdd: Wavedata[] = [];
			for (const item of droppedItems) {
				const isDirectory = await api.checkIsDirectory(item.path);
				if (isDirectory) {
					filesToAdd.push(...(await api.scanDirectory(item.path)));
				} else if (item.name.toLowerCase().endsWith('.wav')) {
					const wavedata = await api.readMetadata(item.path);
					if (wavedata) {
						filesToAdd.push(wavedata);
					}
				}
			}
			storeActions.addFiles(filesToAdd);
		} catch (err) {
			storeActions.setError(
				`Error processing dropped files: ${(err as Error).message}`
			);
		} finally {
			storeActions.setIsLoading(false);
		}
	};

	const handleFilenameMapping = (mapping: Record<number, string>) => {
		const updates = selectedRows
			.map((rowIndex) => {
				const file = filteredFiles[rowIndex];
				const filename = basename(file.filePath);
				const match = filename.match(/(\d+)/);
				if (match) {
					const sceneNumber = parseInt(match[1], 10);
					const newDescription = mapping[sceneNumber];
					if (newDescription) {
						const newBwf: Partial<BWFMetadata> = {
							...file.bwf,
							Description: newDescription,
						};
						return { filePath: file.filePath, data: { bwf: newBwf } };
					}
				}
				return null;
			})
			.filter(Boolean) as { filePath: string; data: Partial<Wavedata> }[];

		storeActions.batchUpdateMetadata(updates);
		setIsMappingModalOpen(false);
	};

	const handleCellEdit = (
		filePath: string,
		field: keyof Wavedata,
		value: string
	) => {
		storeActions.updateFileMetadata(filePath, field, value);
	};

	const handlePlayAudio = (file: Wavedata, e: React.MouseEvent) => {
		e.stopPropagation();
		if (currentFile?.filePath === file.filePath) {
			storeActions.togglePlayPause();
		} else {
			storeActions.loadAudioFile(file);
		}
		storeActions.setPlayerMinimized(false);
	};

	const formatDuration = (seconds: number): string => {
		if (isNaN(seconds) || seconds < 0) return '0:00';
		const minutes = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${minutes}:${secs.toString().padStart(2, '0')}`;
	};

	const formatFileSize = (bytes: number): string => {
		if (isNaN(bytes) || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	};

	return (
		<AppContainer
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
			onDragEnter={() => setDragging(true)}
			onDragLeave={() => setDragging(false)}
			className={dragging ? 'dragging' : ''}>
			<TitleBar />
			<GlobalStyles />

			{error && (
				<ErrorDialog
					message={error}
					onClose={() => storeActions.clearError()}
				/>
			)}

			{isLoading && <Spinner />}

			<FilenameMappingModal
				isOpen={isMappingModalOpen}
				onClose={() => setIsMappingModalOpen(false)}
				onApply={handleFilenameMapping}
				sampleFilename={
					selectedRows.length > 0
						? basename(filteredFiles[selectedRows[0]]?.filePath || '')
						: files.length > 0
						? basename(files[0].filePath)
						: 'example_file_name.wav'
				}
			/>

			<MirrorModal
				isOpen={isMirrorModalOpen}
				onClose={() => setIsMirrorModalOpen(false)}
				selectedFiles={selectedRows
					.map((i) => filteredFiles[i]?.filePath)
					.filter(Boolean)}
				allFiles={files}
				totalFiles={files.length}
			/>

			<ToolBar>
				<Button onClick={handleOpenDirectory}>Select Directory</Button>
				<Button
					onClick={() => setIsMappingModalOpen(true)}
					disabled={files.length === 0}>
					Map Filename
				</Button>
				<Button onClick={handleEmbed} disabled={!isDirty}>
					{isDirty ? 'Embed Changes' : 'No Changes'}
				</Button>
				<Button
					onClick={() => setIsMirrorModalOpen(true)}
					disabled={files.length === 0}>
					Mirror
				</Button>
				<div style={{ marginLeft: 'auto' }}>
					<SearchContainer ref={filterContainerRef}>
						<FilterButton onClick={() => setFilterOpen(!isFilterOpen)}>
							{searchOptions.find((o) => o.value === searchField)?.label ||
								'Filter'}
						</FilterButton>
						<SearchInput
							type='text'
							placeholder='Search...'
							value={searchText}
							onChange={(e) => storeActions.setSearch(e.target.value)}
						/>
						{isFilterOpen && (
							<DropdownMenu>
								{searchOptions.map((option) => (
									<DropdownItem
										key={option.value}
										onClick={() => {
											storeActions.setSearch(searchText, option.value);
											setFilterOpen(false);
										}}>
										{option.label}
									</DropdownItem>
								))}
							</DropdownMenu>
						)}
					</SearchContainer>
				</div>
			</ToolBar>

			<TableContainer>
				{sortedFiles.length === 0 && !isLoading ? (
					<EmptyState>
						<h3>No Files Loaded</h3>
						<p>Select a directory or drop files here to get started.</p>
					</EmptyState>
				) : (
					<Table>
						<thead>
							<tr>
								<TableHeader style={{ width: '50px', textAlign: 'center' }}>
									♫
								</TableHeader>
								<TableHeader onClick={() => handleSort('filename')}>
									Filename{renderSortIndicator('filename')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('show')}>
									Show{renderSortIndicator('show')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('scene')}>
									Scene{renderSortIndicator('scene')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('take')}>
									Take{renderSortIndicator('take')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('ixmlNote')}>
									Note{renderSortIndicator('ixmlNote')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('duration')}>
									Duration{renderSortIndicator('duration')}
								</TableHeader>
								<TableHeader onClick={() => handleSort('fileSize')}>
									Size{renderSortIndicator('fileSize')}
								</TableHeader>
							</tr>
						</thead>
						<tbody>
							{sortedFiles.map((file) => {
								const originalIndex = filteredFiles.findIndex(
									(f) => f.filePath === file.filePath
								);
								const originalFile = originalFiles.find(
									(f) => f.filePath === file.filePath
								);

								return (
									<TableRow
										key={file.filePath}
										selected={selectedRows.includes(originalIndex)}
										onClick={(e) =>
											storeActions.selectFile(
												originalIndex,
												e.ctrlKey || e.metaKey,
												e.shiftKey
											)
										}>
										<TableCell
											style={{ textAlign: 'center', cursor: 'pointer' }}
											onClick={(e) => handlePlayAudio(file, e)}>
											{currentFile?.filePath === file.filePath && isPlaying
												? '⏸'
												: '▶'}
										</TableCell>
										<TableCell>{basename(file.filePath)}</TableCell>
										{EDITABLE_FIELDS.map((field) => (
											<TableCell
												key={field}
												onClick={(e) => e.stopPropagation()}>
												<CellContainer>
													<EditableCell
														value={file[field] as string}
														onChange={(e) =>
															handleCellEdit(
																file.filePath,
																field,
																e.target.value
															)
														}
													/>
													{originalFile?.[field] !== file[field] && (
														<DirtyIndicator />
													)}
												</CellContainer>
											</TableCell>
										))}
										<TableCell>{formatDuration(file.duration)}</TableCell>
										<TableCell>{formatFileSize(file.fileSize)}</TableCell>
									</TableRow>
								);
							})}
						</tbody>
					</Table>
				)}
			</TableContainer>

			<StatusBar>
				<div>
					{files.length > 0 &&
						`${files.length} files loaded${
							selectedRows.length > 0
								? ` • ${selectedRows.length} selected`
								: ''
						}${isDirty ? ' • Unsaved changes' : ''}`}
				</div>
				<div>{/* Agent Status would go here */}</div>
			</StatusBar>
			<AudioPlayer />
		</AppContainer>
	);
};
