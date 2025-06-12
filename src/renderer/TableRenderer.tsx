import React, {
	useEffect,
	useMemo,
	useState,
	useRef,
	useCallback,
} from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { Global } from '@emotion/react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { useStore, AppState } from './store';
import { Wavedata, BWFMetadata, AgentStatus } from '../types';

import { ErrorDialog } from './components/ErrorDialog';
import { FilenameMappingModal } from './components/FilenameMappingModal';
import { AudioPlayer } from './components/AudioPlayer';
import { MirrorModal } from './components/MirrorModal';

// --- UTILITIES ---
const basename = (path: string) => path.split(/[\\/]/).pop() || '';

// --- FONT SIZE CONSTANTS ---
// Change this value to update all metadata field font sizes in one place
// Affects: TableHeader, TableCell, EditableCellInput
const METADATA_FONT_SIZE = '11px';

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

	position: relative;
`;

const UnifiedTopBar = styled.div`
	display: flex;
	align-items: center;
	padding: 8px 12px;
	padding-left: 85px; /* Space for custom positioned traffic lights */
	background: rgba(40, 40, 50, 0.8);
	backdrop-filter: blur(10px);
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	gap: 12px;
	height: 44px; /* Fixed height for proper traffic light centering */
	-webkit-app-region: drag;

	/* Make buttons and inputs non-draggable */
	button,
	input,
	div[role='button'] {
		-webkit-app-region: no-drag;
	}
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
      
      /* Unified scrollbar styles */
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        transition: background 0.2s ease;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      ::-webkit-scrollbar-corner {
        background: rgba(0, 0, 0, 0.1);
      }
    `}
	/>
);

const Button = styled.button`
	background: #007aff;
	color: white;
	border: 1px solid transparent;
	padding: 8px 15px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: background 0.2s ease;
	box-sizing: border-box;
	line-height: 1.2;
	height: 36px;
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

const LeftSection = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const MiddleSection = styled.div`
	display: flex;
	align-items: center;
	margin-left: auto;
	margin-right: auto;
	font-size: 13px;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.7);
	letter-spacing: 0.5px;
`;

const RightSection = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	position: relative;
	z-index: 1000;
`;

const DragOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 123, 255, 0.1);
	backdrop-filter: blur(4px);
	border: 3px dashed #007bff;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	pointer-events: none;
	animation: pulseGlow 2s ease-in-out infinite alternate;

	@keyframes pulseGlow {
		0% {
			background: rgba(0, 123, 255, 0.1);
			border-color: #007bff;
		}
		100% {
			background: rgba(0, 123, 255, 0.2);
			border-color: #0099ff;
		}
	}
`;

const DragMessage = styled.div`
	background: rgba(0, 123, 255, 0.9);
	color: white;
	padding: 20px 30px;
	border-radius: 12px;
	font-size: 18px;
	font-weight: 600;
	text-align: center;
	box-shadow: 0 8px 32px rgba(0, 123, 255, 0.3);
	backdrop-filter: blur(10px);
	border: 1px solid rgba(255, 255, 255, 0.2);

	.icon {
		font-size: 48px;
		margin-bottom: 10px;
		display: block;
	}

	.text {
		font-size: 18px;
		margin-bottom: 8px;
	}

	.subtext {
		font-size: 14px;
		opacity: 0.8;
		font-weight: 400;
	}
`;

const TooltipWrapper = styled.div`
	position: relative;
	display: inline-block;
`;

const Tooltip = styled.div<{ visible: boolean }>`
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	margin-top: 8px;
	padding: 6px 10px;
	background: rgba(0, 0, 0, 0.9);
	color: white;
	font-size: 12px;
	font-weight: 500;
	border-radius: 6px;
	white-space: nowrap;
	opacity: ${(props) => (props.visible ? 1 : 0)};
	visibility: ${(props) => (props.visible ? 'visible' : 'hidden')};
	transition: opacity 0.2s ease, visibility 0.2s ease;
	z-index: 10000;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(4px);

	&::before {
		content: '';
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 4px solid transparent;
		border-bottom-color: rgba(0, 0, 0, 0.9);
	}
`;

const FolderButton = styled.button`
	background: #007aff;
	color: white;
	border: 1px solid transparent;
	padding: 8px 15px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: background 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 44px; /* Ensure consistent width */
	box-sizing: border-box;
	line-height: 1.2;
	height: 36px;

	&:hover {
		background: #0056b3;
	}
	&:disabled {
		background: #444;
		color: #888;
		cursor: not-allowed;
	}

	/* Folder icon SVG */
	&::before {
		content: '';
		width: 16px;
		height: 16px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000000'%3E%3Cpath d='M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z'/%3E%3C/svg%3E");
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}
`;

const Input = styled.input`
	background: rgba(0, 0, 0, 0.2);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #eee;
	padding: 8px 15px;
	border-radius: 6px;
	font-size: 14px;
	transition: border-color 0.2s ease;
	box-sizing: border-box;
	line-height: 1.2;
	height: 36px;

	&:focus {
		outline: none;
		border-color: #007aff;
	}
`;

const DropdownItem = styled.div<{ isSelected?: boolean }>`
	padding: 14px 18px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	color: ${(props) =>
		props.isSelected ? '#007aff' : 'rgba(255, 255, 255, 0.9)'};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: ${(props) =>
		props.isSelected ? 'rgba(0, 122, 255, 0.08)' : 'transparent'};
	user-select: none;

	&:first-child {
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	&:last-child {
		border-bottom: none;
		border-bottom-left-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	&:hover {
		background: linear-gradient(
			90deg,
			rgba(0, 122, 255, 0.12) 0%,
			rgba(0, 122, 255, 0.08) 100%
		);
		color: #007aff;
		transform: translateX(3px);
		box-shadow: inset 3px 0 0 rgba(0, 122, 255, 0.5);
	}

	&:active {
		background: rgba(0, 122, 255, 0.2);
		transform: translateX(1px);
	}

	${(props) =>
		props.isSelected &&
		`
		&::after {
			content: '✓';
			font-size: 12px;
			color: #007aff;
			font-weight: 600;
		}
	`}
`;

const SortIndicator = styled.span`
	font-size: 10px;
	margin-left: 4px;
	opacity: 0.8;
`;

const TableContainer = styled.div`
	flex-grow: 1;
	overflow: auto;
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;
`;

const TableHeader = styled.th`
	background: #333;
	padding: 6px 8px;
	text-align: left;
	cursor: pointer;
	position: sticky;
	top: 0;
	user-select: none;
	font-size: ${METADATA_FONT_SIZE};
	font-weight: 500;
	height: 28px;
	white-space: nowrap;
	overflow: hidden;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
	background: ${(props) => (props.selected ? '#007bff40' : 'transparent')};
	border-bottom: 1px solid #444;
	&:hover {
		background: #ffffff1a;
	}
`;

const TableCell = styled.td`
	padding: 8px;
	border-right: 1px solid #444;
	font-size: ${METADATA_FONT_SIZE};
	&:last-child {
		border-right: none;
	}
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
	font-size: ${METADATA_FONT_SIZE};

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

const SearchContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 300px;
	z-index: 1000;
	isolation: isolate;
`;

const SearchInput = styled(Input)`
	width: 100%;
	padding-right: 40px;
	box-sizing: border-box;
	background: rgba(20, 20, 30, 0.8);
	border: 1px solid rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(10px);
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: #007aff;
		background: rgba(20, 20, 30, 0.95);
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	&:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}
`;

const DropdownArrow = styled.div<{ isOpen: boolean }>`
	position: absolute;
	right: 10px;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	padding: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1001;
	border-radius: 6px;
	transition: all 0.2s ease;
	background: ${(props) =>
		props.isOpen ? 'rgba(0, 122, 255, 0.15)' : 'transparent'};
	user-select: none;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-50%) scale(1.1);
	}

	&::after {
		content: '';
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid
			${(props) => (props.isOpen ? '#007aff' : 'rgba(255, 255, 255, 0.7)')};
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}

	&:hover::after {
		border-top-color: ${(props) =>
			props.isOpen ? '#007aff' : 'rgba(255, 255, 255, 0.95)'};
	}
`;

const DropdownMenu = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	background: linear-gradient(
		135deg,
		rgba(30, 30, 40, 0.98) 0%,
		rgba(20, 20, 30, 0.98) 100%
	);
	backdrop-filter: blur(25px);
	border: 1px solid rgba(255, 255, 255, 0.15);
	border-radius: 12px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6), 0 12px 24px rgba(0, 0, 0, 0.4),
		inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.1);
	z-index: 999999;
	min-width: 160px;
	overflow: hidden;
	isolation: isolate;
	animation: dropdownFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);

	&::before {
		content: '';
		position: absolute;
		top: -6px;
		right: 20px;
		width: 12px;
		height: 12px;
		background: linear-gradient(
			135deg,
			rgba(30, 30, 40, 0.98) 0%,
			rgba(20, 20, 30, 0.98) 100%
		);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-bottom: none;
		border-right: none;
		transform: rotate(45deg);
		backdrop-filter: blur(25px);
	}

	@keyframes dropdownFadeIn {
		from {
			opacity: 0;
			transform: translateY(-12px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
`;

// --- CHILD COMPONENTS ---

interface EditableCellProps {
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface TooltipButtonProps {
	children: React.ReactNode;
	tooltip: string;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
	children,
	tooltip,
	onClick,
	disabled,
	className,
}) => {
	const [isVisible, setIsVisible] = useState(false);

	return (
		<TooltipWrapper
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}>
			<Button onClick={onClick} disabled={disabled} className={className}>
				{children}
			</Button>
			<Tooltip visible={isVisible}>{tooltip}</Tooltip>
		</TooltipWrapper>
	);
};
const EditableCell: React.FC<EditableCellProps> = ({ value, onChange }) => (
	<EditableCellInput type='text' value={value} onChange={onChange} />
);

const EDITABLE_FIELDS = [
	'show',
	'category',
	'subcategory',
	'scene',
	'take',
	'ixmlNote',
] as const;

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
	} = useStoreWithEqualityFn(
		useStore,
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

	const { isPlaying, currentFile } = useStoreWithEqualityFn(
		useStore,
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
	const [dragCounter, setDragCounter] = useState(0);
	const isDragging = dragCounter > 0;
	const [folderTooltipVisible, setFolderTooltipVisible] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Wavedata;
		direction: 'asc' | 'desc';
	} | null>({ key: 'filename', direction: 'asc' });
	const [isFilterOpen, setFilterOpen] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const filterContainerRef = useRef<HTMLDivElement>(null);

	// Check if electronAPI is available
	const [apiReady, setApiReady] = useState(false);
	const [api, setApi] = useState<any>(null);

	useEffect(() => {
		// Check if electronAPI is available immediately
		if (window.electronAPI) {
			console.log('[RENDERER] IPC Status: ✅ Connected');
			setApi(window.electronAPI);
			setApiReady(true);
		} else {
			console.error('[RENDERER] electronAPI not available, using fallback');
			setApi(createFallbackAPI());
			setApiReady(true);
		}
	}, []);

	const searchOptions = [
		{ value: 'all', label: 'All Fields' },
		{ value: 'filename', label: 'Filename' },
		{ value: 'show', label: 'Show' },
		{ value: 'category', label: 'Category' },
		{ value: 'subcategory', label: 'Subcategory' },
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
		// Only set up listeners when API is ready and available
		if (!apiReady || !api) {
			console.log('[RENDERER] API not ready, skipping event listener setup');
			return;
		}

		console.log('[RENDERER] Setting up API event listeners');

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
			if (api) {
				api.removeAllListeners('progress-update');
				api.removeAllListeners('agent-status-change');
				api.removeAllListeners('auto-save-request');
			}
		};
	}, [apiReady, api, storeActions]);

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

	const calculateDropdownPosition = useCallback(() => {
		if (filterContainerRef.current) {
			const rect = filterContainerRef.current.getBoundingClientRect();
			setDropdownPosition({
				top: rect.bottom + 12,
				left: rect.right - 160, // Align right edge with container
			});
		}
	}, []);

	const handleDropdownToggle = useCallback(() => {
		if (!isFilterOpen) {
			calculateDropdownPosition();
		}
		setFilterOpen(!isFilterOpen);
	}, [isFilterOpen, calculateDropdownPosition]);

	const handleClickOutside = (event: MouseEvent) => {
		if (
			filterContainerRef.current &&
			!filterContainerRef.current.contains(event.target as Node)
		) {
			setFilterOpen(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);

		const handleResize = () => {
			if (isFilterOpen) {
				calculateDropdownPosition();
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			window.removeEventListener('resize', handleResize);
		};
	}, [isFilterOpen, calculateDropdownPosition]);

	// --- Keyboard Shortcuts ---
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Don't trigger shortcuts when user is typing in an input field
			const activeElement = document.activeElement;
			const isTyping =
				activeElement?.tagName === 'INPUT' ||
				activeElement?.tagName === 'TEXTAREA' ||
				(activeElement as HTMLElement)?.contentEditable === 'true';

			if (isTyping) return;

			// Handle keyboard shortcuts
			switch (event.key) {
				case ' ': // Space - toggle play/pause or play selected row
					event.preventDefault();
					// If there's a selected row, play that file
					if (selectedRows.length > 0) {
						const selectedIndex = selectedRows[0]; // Play the first selected row
						const selectedFile = filteredFiles[selectedIndex];
						if (selectedFile) {
							console.log(
								'[KEYBOARD] Space pressed - playing selected row:',
								selectedFile.filename
							);
							if (currentFile?.filePath === selectedFile.filePath) {
								storeActions.togglePlayPause();
							} else {
								storeActions.loadAudioFile(selectedFile);
							}
							storeActions.setPlayerMinimized(false);
						}
					} else {
						// No row selected, use default toggle behavior
						console.log(
							'[KEYBOARD] Space pressed - toggle play/pause (no selection)'
						);
						storeActions.togglePlayPause();
					}
					break;

				case 'Enter': // Enter - stop audio
					event.preventDefault();
					// Try to use the global stopAudioFunction first (which controls WaveSurfer directly)
					const globalStopFunction = (window as any).stopAudioFunction;
					if (globalStopFunction) {
						globalStopFunction();
					} else {
						storeActions.stopAudio();
					}
					console.log('[KEYBOARD] Enter pressed - stop audio');
					break;

				case 'm':
				case 'M':
					if (event.metaKey || event.ctrlKey) {
						// CMD+M or Ctrl+M - Mirror
						event.preventDefault();
						if (files.length > 0) {
							setIsMirrorModalOpen(true);
							console.log('[KEYBOARD] CMD+M pressed - open mirror modal');
						}
					}
					break;

				case 'e':
				case 'E':
					if (event.metaKey || event.ctrlKey) {
						// CMD+E or Ctrl+E - Extract
						event.preventDefault();
						if (files.length > 0) {
							setIsMappingModalOpen(true);
							console.log('[KEYBOARD] CMD+E pressed - open extract modal');
						}
					}
					break;

				case 's':
				case 'S':
					if (event.metaKey || event.ctrlKey) {
						// CMD+S or Ctrl+S - Embed
						event.preventDefault();
						if (isDirty) {
							storeActions.saveAllChanges();
							console.log('[KEYBOARD] CMD+S pressed - embed changes');
						}
					}
					break;
			}
		};

		// Add global keyboard event listener
		document.addEventListener('keydown', handleKeyDown);

		// Cleanup
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [files.length, isDirty, storeActions]); // Dependencies for the handlers

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
		if (sortConfig?.key !== key) return null;
		return (
			<SortIndicator>
				{sortConfig.direction === 'asc' ? '▲' : '▼'}
			</SortIndicator>
		);
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
		setDragCounter(0);
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

			// Filter out duplicates by checking against existing files
			const existingFilePaths = new Set(files.map((file) => file.filePath));
			const newFiles = filesToAdd.filter(
				(file) => !existingFilePaths.has(file.filePath)
			);
			const duplicateCount = filesToAdd.length - newFiles.length;

			if (newFiles.length > 0) {
				storeActions.addFiles(newFiles);

				// Log what happened for debugging
				if (duplicateCount > 0) {
					console.log(
						`[DRAG-DROP] Added ${newFiles.length} new file${
							newFiles.length === 1 ? '' : 's'
						}, skipped ${duplicateCount} duplicate${
							duplicateCount === 1 ? '' : 's'
						}.`
					);
				} else {
					console.log(
						`[DRAG-DROP] Added ${newFiles.length} new file${
							newFiles.length === 1 ? '' : 's'
						}.`
					);
				}
			} else if (filesToAdd.length > 0) {
				// Log when all files were duplicates (silent for user)
				console.log(
					`[DRAG-DROP] All ${filesToAdd.length} file${
						filesToAdd.length === 1 ? '' : 's'
					} were already in the list.`
				);
			}
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

	// Don't render until API is ready
	if (!apiReady || !api) {
		return (
			<AppContainer>
				<GlobalStyles />
				<Spinner />
			</AppContainer>
		);
	}

	return (
		<AppContainer
			onDragOver={(e) => e.preventDefault()}
			onDrop={handleDrop}
			onDragEnter={(e) => {
				e.preventDefault();
				setDragCounter((prev) => prev + 1);
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				setDragCounter((prev) => Math.max(0, prev - 1));
			}}>
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

			{isDragging && (
				<DragOverlay>
					<DragMessage>
						<span className='icon'>📂</span>
						<div className='text'>Drop files here</div>
						<div className='subtext'>.wav files and folders accepted</div>
					</DragMessage>
				</DragOverlay>
			)}

			<UnifiedTopBar>
				<LeftSection>
					<TooltipWrapper
						onMouseEnter={() => setFolderTooltipVisible(true)}
						onMouseLeave={() => setFolderTooltipVisible(false)}>
						<FolderButton onClick={handleOpenDirectory}></FolderButton>
						<Tooltip visible={folderTooltipVisible}>
							Open directory to load WAV files
						</Tooltip>
					</TooltipWrapper>
					<TooltipButton
						onClick={() => setIsMappingModalOpen(true)}
						disabled={files.length === 0}
						tooltip='Extract and apply metadata from filenames'>
						Extract
					</TooltipButton>
					<TooltipButton
						onClick={handleEmbed}
						disabled={!isDirty}
						tooltip='Save all metadata changes to WAV files'>
						Embed
					</TooltipButton>
					<TooltipButton
						onClick={() => setIsMirrorModalOpen(true)}
						disabled={files.length === 0}
						tooltip='Copy WAV files to another location'>
						Mirror
					</TooltipButton>
				</LeftSection>

				<MiddleSection>METADATA EDITOR</MiddleSection>

				<RightSection>
					<SearchContainer ref={filterContainerRef}>
						<SearchInput
							type='text'
							placeholder={
								searchField === 'all'
									? 'Search'
									: `Search ${
											searchOptions.find((o) => o.value === searchField)
												?.label || 'Filename'
									  }...`
							}
							value={searchText}
							onChange={(e) => storeActions.setSearch(e.target.value)}
						/>
						<DropdownArrow
							isOpen={isFilterOpen}
							onClick={handleDropdownToggle}
							title='Select search field'
						/>
						{isFilterOpen &&
							createPortal(
								<DropdownMenu
									top={dropdownPosition.top}
									left={dropdownPosition.left}>
									{searchOptions.map((option) => (
										<DropdownItem
											key={option.value}
											isSelected={searchField === option.value}
											onClick={() => {
												storeActions.setSearch(searchText, option.value);
												setFilterOpen(false);
											}}>
											{option.label}
										</DropdownItem>
									))}
								</DropdownMenu>,
								document.body
							)}
					</SearchContainer>
				</RightSection>
			</UnifiedTopBar>

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
								<TableHeader
									style={{ width: '50px', textAlign: 'center' }}
									title='Audio playback controls'>
									♫
								</TableHeader>
								<TableHeader
									style={{ width: '280px' }}
									onClick={() => handleSort('filename')}>
									Filename{renderSortIndicator('filename')}
								</TableHeader>
								<TableHeader
									style={{ width: '80px' }}
									onClick={() => handleSort('show')}>
									Show{renderSortIndicator('show')}
								</TableHeader>
								<TableHeader
									style={{ width: '100px' }}
									onClick={() => handleSort('category')}>
									Category{renderSortIndicator('category')}
								</TableHeader>
								<TableHeader
									style={{ width: '100px' }}
									onClick={() => handleSort('subcategory')}>
									Subcategory{renderSortIndicator('subcategory')}
								</TableHeader>
								<TableHeader
									style={{ width: '80px' }}
									onClick={() => handleSort('scene')}>
									Scene{renderSortIndicator('scene')}
								</TableHeader>
								<TableHeader
									style={{ width: '60px' }}
									onClick={() => handleSort('take')}>
									Take{renderSortIndicator('take')}
								</TableHeader>
								<TableHeader
									style={{ width: '120px' }}
									onClick={() => handleSort('ixmlNote')}>
									Note{renderSortIndicator('ixmlNote')}
								</TableHeader>
								<TableHeader
									style={{ width: '80px' }}
									onClick={() => handleSort('duration')}>
									Duration{renderSortIndicator('duration')}
								</TableHeader>
								<TableHeader
									style={{ width: '80px' }}
									onClick={() => handleSort('fileSize')}>
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
											onClick={(e) => handlePlayAudio(file, e)}
											title={
												currentFile?.filePath === file.filePath && isPlaying
													? 'Pause audio'
													: 'Play audio'
											}>
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

			<AudioPlayer />
		</AppContainer>
	);
};
