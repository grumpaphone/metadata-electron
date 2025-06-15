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
import { SettingsModal } from './components/SettingsModal';

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
	background: var(--bg-primary);
	backdrop-filter: blur(20px);
	border: 1px solid var(--border-primary);
	color: var(--text-primary);
	font-family: 'Inter', sans-serif;
	font-size: var(--font-size-base);

	position: relative;
`;

const UnifiedTopBar = styled.div`
	display: flex;
	align-items: center;
	padding: 8px 12px;
	padding-left: 85px; /* Space for custom positioned traffic lights */
	background: var(--bg-secondary);
	backdrop-filter: blur(10px);
	border-bottom: 1px solid var(--border-primary);
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
	background: var(--accent-primary);
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
	min-width: 44px;
	box-sizing: border-box;
	line-height: 1.2;
	height: 36px;

	&:hover {
		background: var(--accent-hover);
	}
	&:disabled {
		background: var(--bg-tertiary);
		color: var(--text-muted);
		cursor: not-allowed;
	}

	/* Special styling for folder button */
	&.folder-button {
		font-size: 16px;
		padding: 8px 12px;
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
	color: var(--text-muted);
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

const Input = styled.input`
	background: var(--input-bg);
	border: 1px solid var(--border-primary);
	color: var(--text-primary);
	padding: 8px 15px;
	border-radius: 6px;
	font-size: 14px;
	transition: border-color 0.2s ease;
	box-sizing: border-box;
	line-height: 1.2;
	height: 36px;

	&:focus {
		outline: none;
		border-color: var(--accent-primary);
	}
`;

const DropdownItem = styled.div<{ isSelected?: boolean }>`
	padding: 14px 18px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	color: ${(props) =>
		props.isSelected ? 'var(--accent-primary)' : 'var(--dropdown-item-text)'};
	transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	border-bottom: 1px solid var(--border-secondary);
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: ${(props) =>
		props.isSelected ? 'var(--table-row-selected)' : 'transparent'};
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
		background: var(--dropdown-item-hover);
		color: var(--accent-primary);
		transform: translateX(3px);
		box-shadow: inset 3px 0 0 var(--accent-primary);
	}

	&:active {
		background: var(--table-row-selected);
		transform: translateX(1px);
	}

	${(props) =>
		props.isSelected &&
		`
		&::after {
			content: '✓';
			font-size: 12px;
			color: var(--accent-primary);
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
	background: var(--bg-tertiary);
	padding: 6px 8px;
	text-align: left;
	cursor: pointer;
	position: sticky;
	top: 0;
	user-select: none;
	font-size: var(--font-size-base);
	font-weight: 500;
	height: 28px;
	white-space: nowrap;
	overflow: hidden;
	color: var(--text-secondary);
`;

const TableRow = styled.tr<{ selected?: boolean }>`
	background: ${(props) =>
		props.selected ? 'var(--table-row-selected)' : 'transparent'};
	border-bottom: 1px solid var(--border-secondary);
	user-select: none;
	cursor: pointer;
	&:hover {
		background: var(--table-row-hover);
	}
`;

const TableCell = styled.td`
	padding: 8px;
	border-right: 1px solid var(--border-secondary);
	font-size: var(--font-size-base);
	color: var(--text-primary);
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
	color: var(--text-muted);
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
		background: var(--input-focus-bg);
		border-color: var(--accent-primary);
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
	background: var(--input-bg);
	border: 1px solid var(--border-primary);
	backdrop-filter: blur(10px);
	transition: all 0.2s ease;
	color: var(--text-primary);

	&:focus {
		outline: none;
		border-color: var(--accent-primary);
		background: var(--input-bg);
		box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
	}

	&:hover {
		border-color: var(--border-primary);
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
		props.isOpen ? 'var(--table-row-selected)' : 'transparent'};
	user-select: none;

	&:hover {
		background: var(--table-row-hover);
		transform: translateY(-50%) scale(1.1);
	}

	&::after {
		content: '';
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid
			${(props) =>
				props.isOpen ? 'var(--accent-primary)' : 'var(--text-muted)'};
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
	}

	&:hover::after {
		border-top-color: ${(props) =>
			props.isOpen ? 'var(--accent-primary)' : 'var(--text-secondary)'};
	}
`;

const DropdownMenu = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	background: var(--dropdown-bg);
	backdrop-filter: blur(25px);
	border: 1px solid var(--dropdown-border);
	border-radius: 12px;
	box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3), 0 12px 24px rgba(0, 0, 0, 0.2),
		inset 0 1px 0 var(--border-primary), 0 0 0 1px var(--border-secondary);
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
		background: var(--dropdown-bg);
		border: 1px solid var(--dropdown-border);
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

const PortalTooltip = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	transform: translateX(-50%);
	padding: 6px 10px;
	background: var(--bg-tertiary);
	color: var(--text-primary);
	font-size: 12px;
	font-weight: 500;
	border-radius: 6px;
	white-space: nowrap;
	z-index: 1000000; /* Higher than dropdown menu (999999) */
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	backdrop-filter: blur(4px);
	pointer-events: none; /* Prevent tooltip from interfering with mouse events */
	animation: tooltipFadeIn 0.2s ease;
	border: 1px solid var(--border-primary);

	&::before {
		content: '';
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 4px solid transparent;
		border-bottom-color: var(--bg-tertiary);
	}

	@keyframes tooltipFadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-5px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
`;

// Add context menu styles
const ContextMenu = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	background: rgba(30, 30, 40, 0.95);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 8px;
	padding: 4px 0;
	min-width: 120px;
	z-index: 1000;
	box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const ContextMenuItem = styled.div<{ danger?: boolean }>`
	padding: 8px 16px;
	color: ${(props) => (props.danger ? '#ff6b6b' : '#e2e8f0')};
	cursor: pointer;
	font-size: 12px;
	transition: background-color 0.2s ease;

	&:hover {
		background: ${(props) =>
			props.danger ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
	}

	&:first-child {
		border-radius: 6px 6px 0 0;
	}

	&:last-child {
		border-radius: 0 0 6px 6px;
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
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const buttonRef = useRef<HTMLButtonElement>(null);

	const updatePosition = useCallback(() => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({
				top: rect.bottom + 8, // 8px below the button
				left: rect.left + rect.width / 2, // Center horizontally
			});
		}
	}, []);

	const handleMouseEnter = useCallback(() => {
		updatePosition();
		setIsVisible(true);
	}, [updatePosition]);

	const handleMouseLeave = useCallback(() => {
		setIsVisible(false);
	}, []);

	return (
		<>
			<Button
				ref={buttonRef}
				onClick={onClick}
				disabled={disabled}
				className={className}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}>
				{children}
			</Button>
			{isVisible &&
				createPortal(
					<PortalTooltip top={position.top} left={position.left}>
						{tooltip}
					</PortalTooltip>,
					document.body
				)}
		</>
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
		files,
		originalFiles,
		filteredFiles,
		selectedRows,
		searchText,
		searchField,
		isLoading,
		error,
		isDirty,
		currentFile,
		isPlaying,
		settings,
		columnVisibility,
		columnOrder,
	} = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => ({
			files: state.files,
			originalFiles: state.originalFiles,
			filteredFiles: state.filteredFiles,
			selectedRows: state.selectedRows,
			searchText: state.searchText,
			searchField: state.searchField,
			isLoading: state.isLoading,
			error: state.error,
			isDirty: state.isDirty,
			currentFile: state.audioPlayer.currentFile,
			isPlaying: state.audioPlayer.isPlaying,
			settings: state.settings,
			columnVisibility: state.columnVisibility,
			columnOrder: state.columnOrder,
		}),
		shallow
	);

	// --- Actions (via getState to avoid re-renders) ---
	const storeActions = useStore.getState();

	// --- Component State ---
	const [isFilterOpen, setFilterOpen] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const [dragCounter, setDragCounter] = useState(0);
	const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
	const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof Wavedata;
		direction: 'asc' | 'desc';
	} | null>({ key: 'filename', direction: 'asc' });

	// Add context menu state
	const [contextMenu, setContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		fileIndex: number;
	} | null>(null);

	// Add column header context menu state
	const [columnContextMenu, setColumnContextMenu] = useState<{
		visible: boolean;
		x: number;
		y: number;
		column: string;
	} | null>(null);

	// Add drag and drop state
	const [dragState, setDragState] = useState<{
		isDragging: boolean;
		draggedColumnIndex: number | null;
		dropTargetIndex: number | null;
	}>({
		isDragging: false,
		draggedColumnIndex: null,
		dropTargetIndex: null,
	});

	const filterContainerRef = useRef<HTMLDivElement>(null);
	const contextMenuRef = useRef(contextMenu);
	const columnContextMenuRef = useRef(columnContextMenu);
	const isFilterOpenRef = useRef(isFilterOpen);

	// Keep refs in sync with state
	useEffect(() => {
		contextMenuRef.current = contextMenu;
	}, [contextMenu]);

	useEffect(() => {
		columnContextMenuRef.current = columnContextMenu;
	}, [columnContextMenu]);

	useEffect(() => {
		isFilterOpenRef.current = isFilterOpen;
	}, [isFilterOpen]);

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

	// Define all columns configuration
	const columnConfigs = {
		audio: {
			key: 'audio',
			label: '♫',
			width: '50px',
			sortable: false,
			hideable: false,
		},
		filename: {
			key: 'filename',
			label: 'Filename',
			width: '280px',
			sortable: true,
			hideable: true,
		},
		show: {
			key: 'show',
			label: 'Show',
			width: '80px',
			sortable: true,
			hideable: true,
		},
		category: {
			key: 'category',
			label: 'Category',
			width: '100px',
			sortable: true,
			hideable: true,
		},
		subcategory: {
			key: 'subcategory',
			label: 'Subcategory',
			width: '100px',
			sortable: true,
			hideable: true,
		},
		scene: {
			key: 'scene',
			label: 'Scene',
			width: '80px',
			sortable: true,
			hideable: true,
		},
		take: {
			key: 'take',
			label: 'Take',
			width: '60px',
			sortable: true,
			hideable: true,
		},
		ixmlNote: {
			key: 'ixmlNote',
			label: 'Note',
			width: '120px',
			sortable: true,
			hideable: true,
		},
		duration: {
			key: 'duration',
			label: 'Duration',
			width: '80px',
			sortable: true,
			hideable: true,
		},
		fileSize: {
			key: 'fileSize',
			label: 'Size',
			width: '80px',
			sortable: true,
			hideable: true,
		},
	};

	// Create ordered columns array based on columnOrder state
	const orderedColumns = columnOrder.map(
		(columnKey) => columnConfigs[columnKey]
	);

	// Create visible columns array for drag logic
	const visibleColumns = orderedColumns.filter((column) => {
		// Always include non-hideable columns (like audio controls)
		if (!column.hideable) return true;
		// Check visibility for hideable columns
		return columnVisibility[column.key as keyof typeof columnVisibility];
	});

	// Debug logging for column order
	console.log('[COLUMN-ORDER] Current columnOrder:', columnOrder);
	console.log(
		'[COLUMN-ORDER] Ordered columns:',
		orderedColumns.map((col) => col?.label || 'undefined')
	);
	console.log(
		'[COLUMN-ORDER] Visible columns:',
		visibleColumns.map((col) => col?.label || 'undefined')
	);

	// --- Memos & Effects ---
	const sortedFiles = useMemo(() => {
		// Use filteredFiles if search is active, otherwise use all files
		const filesToSort = searchText ? filteredFiles : files;

		console.log('[SORT] sortedFiles calculation:', {
			searchText: searchText,
			hasSearchText: !!searchText,
			filesLength: files.length,
			filteredFilesLength: filteredFiles.length,
			filesToSortLength: filesToSort.length,
		});

		if (!sortConfig) return filesToSort;

		return [...filesToSort].sort((a, b) => {
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
	}, [files, filteredFiles, searchText, sortConfig]);

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

	// Enhanced click outside handler for dropdown and context menus
	const handleDocumentClick = useCallback(
		(event: MouseEvent) => {
			// Use refs to get current state without dependencies
			const currentContextMenu = contextMenuRef.current;
			const currentColumnContextMenu = columnContextMenuRef.current;
			const currentFilterOpen = isFilterOpenRef.current;

			// Handle file context menu - only close if click is outside the context menu
			if (currentContextMenu) {
				const target = event.target as Element;
				// Check if the click is on a context menu item or its children
				const isContextMenuClick = target.closest('[data-context-menu]');
				if (!isContextMenuClick) {
					console.log('[CONTEXT-MENU] Click outside context menu, closing');
					setContextMenu(null);
				} else {
					console.log('[CONTEXT-MENU] Click inside context menu, keeping open');
				}
			}

			// Handle column context menu - only close if click is outside the context menu
			if (currentColumnContextMenu) {
				const target = event.target as Element;
				const isColumnContextMenuClick = target.closest(
					'[data-column-context-menu]'
				);
				if (!isColumnContextMenuClick) {
					console.log(
						'[COLUMN-CONTEXT-MENU] Click outside column context menu, closing'
					);
					setColumnContextMenu(null);
				} else {
					console.log(
						'[COLUMN-CONTEXT-MENU] Click inside column context menu, keeping open'
					);
				}
			}

			// Handle dropdown
			if (
				currentFilterOpen &&
				filterContainerRef.current &&
				!filterContainerRef.current.contains(event.target as Node)
			) {
				setFilterOpen(false);
			}
		},
		[] // Empty dependency array to prevent re-creation
	);

	useEffect(() => {
		document.addEventListener('mousedown', handleDocumentClick);

		const handleResize = () => {
			if (isFilterOpen) {
				calculateDropdownPosition();
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			document.removeEventListener('mousedown', handleDocumentClick);
			window.removeEventListener('resize', handleResize);
		};
	}, [isFilterOpen, calculateDropdownPosition, handleDocumentClick]);

	// Add context menu handlers
	const handleContextMenu = useCallback(
		(e: React.MouseEvent, fileIndex: number) => {
			e.preventDefault();
			e.stopPropagation();

			console.log('[CONTEXT-MENU] Right-click on file with index:', fileIndex);
			console.log(
				'[CONTEXT-MENU] File at index:',
				files[fileIndex]?.filename || 'undefined'
			);

			setContextMenu({
				visible: true,
				x: e.clientX,
				y: e.clientY,
				fileIndex,
			});
		},
		[files]
	);

	const handleRemoveFile = useCallback(() => {
		console.log('[CONTEXT-MENU] handleRemoveFile called');
		console.log('[CONTEXT-MENU] contextMenu:', contextMenu);
		console.log('[CONTEXT-MENU] selectedRows:', selectedRows);

		if (contextMenu) {
			// If the file being removed is currently selected, select all selected indices
			// Otherwise, just remove the single file
			const indicesToRemove = selectedRows.includes(contextMenu.fileIndex)
				? selectedRows
				: [contextMenu.fileIndex];

			console.log('[CONTEXT-MENU] indicesToRemove:', indicesToRemove);
			console.log('[CONTEXT-MENU] About to call removeFiles via storeActions');

			// Use the same pattern as other functions in this component
			storeActions.removeFiles(indicesToRemove);

			console.log('[CONTEXT-MENU] Called removeFiles, closing context menu');
			setContextMenu(null);
		} else {
			console.log('[CONTEXT-MENU] No contextMenu available');
		}
	}, [contextMenu, selectedRows]);

	// Add column header context menu handlers
	const handleColumnContextMenu = useCallback(
		(e: React.MouseEvent, column: string) => {
			e.preventDefault();
			e.stopPropagation();

			console.log('[COLUMN-CONTEXT-MENU] Right-click on column:', column);

			setColumnContextMenu({
				visible: true,
				x: e.clientX,
				y: e.clientY,
				column,
			});
		},
		[]
	);

	const handleToggleColumn = useCallback(
		(column: string) => {
			console.log('[COLUMN-CONTEXT-MENU] Toggle column:', column);
			storeActions.toggleColumnVisibility(column as any);
			setColumnContextMenu(null);
		},
		[storeActions]
	);

	const handleResetColumns = useCallback(() => {
		console.log('[COLUMN-CONTEXT-MENU] Reset all columns');
		storeActions.resetColumnVisibility();
		setColumnContextMenu(null);
	}, [storeActions]);

	// Add drag and drop handlers
	const handleDragStart = useCallback(
		(e: React.DragEvent, columnIndex: number) => {
			console.log('[DRAG] Drag start for column index:', columnIndex);
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', columnIndex.toString());
			// Mark this as a column drag to distinguish from file drag
			e.dataTransfer.setData('application/column-reorder', 'true');

			setDragState({
				isDragging: true,
				draggedColumnIndex: columnIndex,
				dropTargetIndex: null,
			});
		},
		[]
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent, columnIndex: number) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';

			setDragState((prev) => ({
				...prev,
				dropTargetIndex: columnIndex,
			}));
		},
		[]
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		// Only clear if we're leaving the entire column header area
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const isLeavingColumn =
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom;

		if (isLeavingColumn) {
			setDragState((prev) => ({
				...prev,
				dropTargetIndex: null,
			}));
		}
	}, []);

	const handleColumnDrop = useCallback(
		(e: React.DragEvent, dropIndex: number) => {
			e.preventDefault();

			const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));

			console.log('[DRAG] Drop - from:', draggedIndex, 'to:', dropIndex);

			if (draggedIndex !== dropIndex && draggedIndex !== null) {
				// Convert visual indices (from visible columns) to columnOrder indices
				const draggedColumn = visibleColumns[draggedIndex];
				const dropColumn = visibleColumns[dropIndex];

				if (draggedColumn && dropColumn) {
					const draggedOrderIndex = columnOrder.indexOf(
						draggedColumn.key as any
					);
					const dropOrderIndex = columnOrder.indexOf(dropColumn.key as any);

					console.log(
						'[DRAG] Converting indices - visual:',
						{ draggedIndex, dropIndex },
						'visible columns:',
						{
							draggedColumn: draggedColumn.label,
							dropColumn: dropColumn.label,
						},
						'order:',
						{ draggedOrderIndex, dropOrderIndex }
					);

					if (draggedOrderIndex !== -1 && dropOrderIndex !== -1) {
						storeActions.reorderColumns(draggedOrderIndex, dropOrderIndex);
					}
				}
			}

			setDragState({
				isDragging: false,
				draggedColumnIndex: null,
				dropTargetIndex: null,
			});
		},
		[storeActions, visibleColumns, columnOrder]
	);

	const handleDragEnd = useCallback((e: React.DragEvent) => {
		console.log('[DRAG] Drag end');

		setDragState({
			isDragging: false,
			draggedColumnIndex: null,
			dropTargetIndex: null,
		});
	}, []);

	// --- Keyboard Shortcuts ---
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Don't trigger shortcuts when user is typing in an input field
			const activeElement = document.activeElement;
			const isTyping =
				activeElement?.tagName === 'INPUT' ||
				activeElement?.tagName === 'TEXTAREA' ||
				(activeElement instanceof HTMLElement &&
					activeElement.contentEditable === 'true');

			if (isTyping) return;

			// Handle keyboard shortcuts
			switch (event.key) {
				case ' ': // Space - toggle play/pause or play selected row
					event.preventDefault();
					// If there's a selected row, play that file
					if (selectedRows.length > 0) {
						const selectedIndex = selectedRows[0]; // Play the first selected row
						const selectedFile = files[selectedIndex];
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
					{
						event.preventDefault();
						// Try to use the global stopAudioFunction first (which controls WaveSurfer directly)
						const globalStopFunction = (window as any).stopAudioFunction;
						if (globalStopFunction) {
							globalStopFunction();
						} else {
							storeActions.stopAudio();
						}
						console.log('[KEYBOARD] Enter pressed - stop audio');
					}
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
				const file = files[rowIndex];
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

	// Derive isDragging from dragCounter
	const isDraggingActive = dragCounter > 0;

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
			onDragOver={(e) => {
				e.preventDefault();
				// Don't show file drop effect for column reordering
				if (e.dataTransfer.types.includes('application/column-reorder')) {
					e.dataTransfer.dropEffect = 'none';
				}
			}}
			onDrop={handleDrop}
			onDragEnter={(e) => {
				e.preventDefault();
				// Don't increment drag counter for column reordering
				if (!e.dataTransfer.types.includes('application/column-reorder')) {
					setDragCounter((prev) => prev + 1);
				}
			}}
			onDragLeave={(e) => {
				e.preventDefault();
				// Don't decrement drag counter for column reordering
				if (!e.dataTransfer.types.includes('application/column-reorder')) {
					setDragCounter((prev) => Math.max(0, prev - 1));
				}
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
						? basename(files[selectedRows[0]]?.filePath || '')
						: files.length > 0
						? basename(files[0].filePath)
						: 'example_file_name.wav'
				}
			/>

			<MirrorModal
				isOpen={isMirrorModalOpen}
				onClose={() => setIsMirrorModalOpen(false)}
				selectedFiles={selectedRows
					.map((i) => files[i]?.filePath)
					.filter(Boolean)}
				allFiles={files}
				totalFiles={files.length}
			/>

			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={() => setIsSettingsModalOpen(false)}
				isDarkMode={settings.isDarkMode}
				onThemeToggle={storeActions.toggleDarkMode}
				fontSize={settings.fontSize}
				onFontSizeChange={storeActions.setFontSize}
				showTooltips={settings.showTooltips}
				onTooltipsToggle={storeActions.toggleTooltips}
			/>

			{isDraggingActive && (
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
					<TooltipButton
						onClick={handleOpenDirectory}
						tooltip='Open directory to load WAV files'
						className='folder-button'>
						📁
					</TooltipButton>
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
					<TooltipButton
						onClick={() => setIsSettingsModalOpen(true)}
						tooltip='Open application settings'>
						⚙️
					</TooltipButton>
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
								{visibleColumns.map((column, columnIndex) => {
									// Non-hideable columns (like audio controls)
									if (!column.hideable) {
										return (
											<TableHeader
												key={column.key}
												style={{
													width: column.width,
													textAlign: column.key === 'audio' ? 'center' : 'left',
												}}
												title={
													column.key === 'audio'
														? 'Audio playback controls'
														: undefined
												}>
												{column.label}
											</TableHeader>
										);
									}

									// Hideable columns (all visible ones are included in visibleColumns)
									const isDragged =
										dragState.draggedColumnIndex === columnIndex;
									const isDropTarget =
										dragState.dropTargetIndex === columnIndex;

									return (
										<TableHeader
											key={column.key}
											draggable
											style={{
												width: column.width,
												opacity: isDragged ? 0.5 : 1,
												backgroundColor: isDropTarget
													? 'rgba(0, 122, 255, 0.2)'
													: undefined,
												borderLeft: isDropTarget
													? '2px solid #007aff'
													: undefined,
												cursor: 'move',
											}}
											onClick={
												column.sortable
													? () => handleSort(column.key as keyof Wavedata)
													: undefined
											}
											onContextMenu={(e) =>
												handleColumnContextMenu(e, column.key)
											}
											onDragStart={(e) => handleDragStart(e, columnIndex)}
											onDragOver={(e) => handleDragOver(e, columnIndex)}
											onDragLeave={handleDragLeave}
											onDrop={(e) => handleColumnDrop(e, columnIndex)}
											onDragEnd={handleDragEnd}
											title={`Drag to reorder • Right-click to show/hide columns`}>
											{column.label}
											{column.sortable &&
												renderSortIndicator(column.key as keyof Wavedata)}
										</TableHeader>
									);
								})}
							</tr>
						</thead>
						<tbody>
							{sortedFiles.map((file) => {
								const originalIndex = files.findIndex(
									(f) => f.filePath === file.filePath
								);
								const originalFile = originalFiles.find(
									(f) => f.filePath === file.filePath
								);

								// Skip rendering if originalIndex is invalid
								if (originalIndex === -1) {
									console.warn(
										'[TABLE] Could not find originalIndex for file:',
										file.filename
									);
									return null;
								}

								return (
									<TableRow
										key={file.filePath}
										selected={selectedRows.includes(originalIndex)}
										onClick={(e) => {
											// Prevent default text selection behavior
											e.preventDefault();

											// Clear any existing text selection when shift-clicking
											if (e.shiftKey && window.getSelection) {
												window.getSelection()?.removeAllRanges();
											}

											storeActions.selectFile(
												originalIndex,
												e.ctrlKey || e.metaKey,
												e.shiftKey
											);
										}}
										onContextMenu={(e) => handleContextMenu(e, originalIndex)}>
										{visibleColumns.map((column) => {
											// Non-hideable columns (like audio controls)
											if (!column.hideable) {
												return (
													<TableCell
														key={column.key}
														style={{ textAlign: 'center', cursor: 'pointer' }}
														onClick={(e) => handlePlayAudio(file, e)}
														title={
															currentFile?.filePath === file.filePath &&
															isPlaying
																? 'Pause audio'
																: 'Play audio'
														}>
														{currentFile?.filePath === file.filePath &&
														isPlaying
															? '⏸'
															: '▶'}
													</TableCell>
												);
											}

											// Hideable columns (all visible ones are included in visibleColumns)

											// Render different cell types based on column
											if (column.key === 'filename') {
												return (
													<TableCell key={column.key}>
														{basename(file.filePath)}
													</TableCell>
												);
											} else if (EDITABLE_FIELDS.includes(column.key as any)) {
												return (
													<TableCell
														key={column.key}
														onClick={(e) => e.stopPropagation()}>
														<CellContainer>
															<EditableCell
																value={
																	file[column.key as keyof Wavedata] as string
																}
																onChange={(e) =>
																	handleCellEdit(
																		file.filePath,
																		column.key as keyof Wavedata,
																		e.target.value
																	)
																}
															/>
															{originalFile?.[column.key as keyof Wavedata] !==
																file[column.key as keyof Wavedata] && (
																<DirtyIndicator />
															)}
														</CellContainer>
													</TableCell>
												);
											} else if (column.key === 'duration') {
												return (
													<TableCell key={column.key}>
														{formatDuration(file.duration)}
													</TableCell>
												);
											} else if (column.key === 'fileSize') {
												return (
													<TableCell key={column.key}>
														{formatFileSize(file.fileSize)}
													</TableCell>
												);
											}

											return null;
										})}
									</TableRow>
								);
							})}
						</tbody>
					</Table>
				)}
			</TableContainer>

			<AudioPlayer />

			{/* Context Menu */}
			{contextMenu &&
				createPortal(
					<ContextMenu
						top={contextMenu.y}
						left={contextMenu.x}
						data-context-menu>
						<ContextMenuItem
							danger
							onClick={handleRemoveFile}
							data-context-menu>
							{selectedRows.includes(contextMenu.fileIndex) &&
							selectedRows.length > 1
								? `Remove ${selectedRows.length} files`
								: 'Remove file'}
						</ContextMenuItem>
					</ContextMenu>,
					document.body
				)}

			{/* Column Header Context Menu */}
			{columnContextMenu &&
				createPortal(
					<ContextMenu
						top={columnContextMenu.y}
						left={columnContextMenu.x}
						data-column-context-menu>
						{orderedColumns
							.filter((col) => col.hideable)
							.map((column) => (
								<ContextMenuItem
									key={column.key}
									onClick={() => handleToggleColumn(column.key)}
									data-column-context-menu>
									<span style={{ marginRight: '8px' }}>
										{columnVisibility[
											column.key as keyof typeof columnVisibility
										]
											? '☑'
											: '☐'}
									</span>
									{column.label}
								</ContextMenuItem>
							))}
						<ContextMenuItem
							onClick={handleResetColumns}
							data-column-context-menu
							style={{
								borderTop: '1px solid rgba(255, 255, 255, 0.1)',
								marginTop: '4px',
								paddingTop: '8px',
							}}>
							Reset Column Visibility
						</ContextMenuItem>
						<ContextMenuItem
							onClick={storeActions.resetColumnOrder}
							data-column-context-menu>
							Reset Column Order
						</ContextMenuItem>
					</ContextMenu>,
					document.body
				)}
		</AppContainer>
	);
};
