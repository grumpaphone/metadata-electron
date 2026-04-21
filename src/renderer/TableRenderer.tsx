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
import { useStore, AppState, ColumnKey, ColumnVisibilityState } from './store';
import { Wavedata, AgentStatus, LoadingProgress } from '../types';

import { ErrorDialog } from './components/ErrorDialog';
import { FilenameMappingModal } from './components/FilenameMappingModal';
import { AudioPlayer } from './components/AudioPlayer';
import { MirrorModal } from './components/MirrorModal';
import { SettingsModal } from './components/SettingsModal';
import { TopBar } from './components/TopBar';
import { EmptyState } from './components/EmptyState';
import { DragOverlay } from './components/DragOverlay';
import { WaveSurferController } from './audio/WaveSurferController';
import { MetadataTableRow } from './components/table/MetadataTableRow';
import { KeyboardShortcutsModal } from './components/KeyboardShortcuts';
import { AgentStatusBar } from './components/AgentStatusBar';
import { ProgressBar } from './components/ProgressBar';
import { throttle } from './utils/throttle';
import { basename } from './utils/format';
import { SortAscIcon, SortDescIcon, CheckboxIcon } from './components/Icons';

const createFallbackAPI = (): typeof window.electronAPI => {
	console.warn('Fallback API created. IPC is not available.');
	const noop = () => { /* no-op */ };
	const noopPromise = () => Promise.resolve(undefined as never);
	return {
		onProgressUpdate: () => noop,
		onAgentStatusChange: () => noop,
		onFileChanged: () => noop,
		showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] as string[] }),
		scanDirectory: () => Promise.resolve([] as Wavedata[]),
		checkIsDirectory: () => Promise.resolve(false),
		readMetadata: () => Promise.resolve(null as unknown as Wavedata),
		writeMetadata: noopPromise,
		loadAudioFile: noopPromise,
		getPathForFile: (file: File) => (file as unknown as { path: string }).path || file.name,
		startFileWatching: noopPromise,
		stopFileWatching: noopPromise,
		openFileDialog: noopPromise,
		selectMirrorDestination: () => Promise.resolve(null),
		mirrorFiles: noopPromise,
		cancelMirror: noopPromise,
		checkFileConflicts: () => Promise.resolve([]),
		getAgentStatuses: () => Promise.resolve([]),
		toggleAgent: noopPromise,
		createTestFiles: () => Promise.resolve({ success: false, directory: '', files: [], errors: [] }),
		debugLog: noopPromise,
		windowMinimize: noopPromise,
		windowClose: noopPromise,
		windowToggleFullscreen: noopPromise,
	};
};

// --- STYLED COMPONENTS ---

const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: var(--bg-primary);
	color: var(--text-primary);
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: var(--font-size-base);
	border-radius: var(--window-corner-radius);
	overflow: hidden;
`;

const GlobalStyles = () => (
	<Global
		styles={`
      body, html {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: var(--bg-primary);
        color: var(--text-primary);
        -webkit-font-smoothing: antialiased;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
      }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: var(--scrollbar-track); border-radius: 4px; }
      ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: var(--scrollbar-thumb-hover); }
      ::-webkit-scrollbar-corner { background: var(--scrollbar-track); }
      body.reduce-motion *, body.reduce-motion *::before, body.reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
      body.reduce-transparency * { backdrop-filter: none !important; }
    `}
	/>
);

const Spinner = styled.div`
	border: 4px solid var(--fill-tertiary);
	border-radius: 50%;
	border-top: 4px solid var(--accent-primary);
	width: 40px; height: 40px;
	animation: spin 1s linear infinite;
	position: fixed; top: 50%; left: 50%;
	margin-left: -20px; margin-top: -20px;
	z-index: 1001;
	@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
`;

const TableContainer = styled.div`
	flex-grow: 1;
	overflow: auto;
	background: var(--bg-primary);
`;

const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	table-layout: fixed;
`;

const TableHeader = styled.th<{ isScrolled?: boolean }>`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: 11px;
	font-weight: 600;
	line-height: 1.36364;
	letter-spacing: 0.06px;
	text-transform: uppercase;
	background: var(--bg-secondary);
	color: var(--text-secondary);
	padding: 6px 8px;
	height: 28px;
	text-align: left;
	cursor: pointer;
	user-select: none;
	position: sticky;
	top: 0;
	z-index: 10;
	border-bottom: 0.5px solid var(--border-primary);
	box-shadow: ${(props) => props.isScrolled ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none'};
	transition: box-shadow 0.2s ease;
	body.reduce-motion & { transition: none; }
`;

const SortIndicator = styled.span`
	margin-left: 4px;
	opacity: 0.8;
	display: inline-flex;
	vertical-align: middle;
`;

const ContextMenu = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	background: var(--bg-glass);
	backdrop-filter: var(--glass-modal);
	border: 1px solid var(--border-primary);
	border-radius: 10px;
	padding: 4px 0;
	min-width: 120px;
	z-index: 2000;
	overflow: hidden;
	box-shadow: 0 20px 40px rgba(8, 16, 32, 0.4);
`;

const ContextMenuItem = styled.div<{ danger?: boolean }>`
	padding: 8px 16px;
	color: ${(props) => (props.danger ? 'var(--color-error)' : 'var(--text-primary)')};
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background 0.15s ease;
	&:hover {
		background: ${(props) =>
			props.danger ? 'var(--context-danger-hover)' : 'var(--context-hover)'};
	}
`;

const ContextMenuShortcut = styled.span`
	margin-left: auto;
	font-size: 11px;
	color: var(--text-muted);
	font-family: 'Monaco', 'Menlo', monospace;
`;

const ContextMenuSeparator = styled.div`
	height: 1px;
	background: var(--border-secondary);
	margin: 4px 0;
`;

const COLUMN_CONFIGS: Record<ColumnKey, { key: ColumnKey; label: string; width: string; sortable: boolean; hideable: boolean }> = {
	audio: { key: 'audio', label: '', width: '50px', sortable: false, hideable: false },
	filename: { key: 'filename', label: 'Filename', width: '280px', sortable: true, hideable: true },
	show: { key: 'show', label: 'Show', width: '80px', sortable: true, hideable: true },
	category: { key: 'category', label: 'Category', width: '100px', sortable: true, hideable: true },
	subcategory: { key: 'subcategory', label: 'Subcategory', width: '100px', sortable: true, hideable: true },
	scene: { key: 'scene', label: 'Scene', width: '80px', sortable: true, hideable: true },
	take: { key: 'take', label: 'Take', width: '60px', sortable: true, hideable: true },
	ixmlNote: { key: 'ixmlNote', label: 'Note', width: '120px', sortable: true, hideable: true },
	duration: { key: 'duration', label: 'Duration', width: '80px', sortable: true, hideable: true },
	fileSize: { key: 'fileSize', label: 'Size', width: '80px', sortable: true, hideable: true },
};

// --- MAIN APP COMPONENT ---
export const App: React.FC = () => {
	const {
		files, filteredFiles, selectedRows,
		searchText, searchField, isLoading, error, isDirty,
		settings, columnVisibility, columnOrder,
	} = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => ({
			files: state.files,
			filteredFiles: state.filteredFiles,
			selectedRows: state.selectedRows,
			searchText: state.searchText,
			searchField: state.searchField,
			isLoading: state.isLoading,
			error: state.error,
			isDirty: state.isDirty,
			settings: state.settings,
			columnVisibility: state.columnVisibility,
			columnOrder: state.columnOrder,
		}),
		shallow
	);

	// Subscribe to originalFiles separately (changes less frequently than files).
	const originalFiles = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => state.originalFiles,
		Object.is
	);

	// Subscribe only to the audio-player fields that affect the table row visuals.
	// Avoid subscribing to currentTime/waveformReady/etc. which would re-render on every tick.
	const currentFile = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => state.audioPlayer.currentFile,
		Object.is
	);
	const isPlaying = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => state.audioPlayer.isPlaying,
		Object.is
	);

	// Live agent statuses for SettingsModal toggle mirroring.
	const agentStatuses = useStoreWithEqualityFn(
		useStore,
		(state: AppState) => state.agentStatuses,
		shallow
	);

	const [dragCounter, setDragCounter] = useState(0);
	const dragCounterRef = useRef(0);
	const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
	const [isMirrorModalOpen, setIsMirrorModalOpen] = useState(false);
	const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
	const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
	const [sortConfig, setSortConfig] = useState<{ key: keyof Wavedata; direction: 'asc' | 'desc' } | null>({ key: 'filename', direction: 'asc' });
	const [contextMenu, setContextMenu] = useState<{ x: number; y: number; filePath: string } | null>(null);
	const [columnContextMenu, setColumnContextMenu] = useState<{ x: number; y: number } | null>(null);
	const [scrollState, setScrollState] = useState({ isScrolled: false });
	const [dragState, setDragState] = useState<{ isDragging: boolean; draggedColumnIndex: number | null; dropTargetIndex: number | null }>({
		isDragging: false, draggedColumnIndex: null, dropTargetIndex: null,
	});

	const tableContainerRef = useRef<HTMLDivElement>(null);
	const lastAnchorRef = useRef<string | null>(null);

	const [apiReady, setApiReady] = useState(false);
	const [api, setApi] = useState<typeof window.electronAPI | null>(null);

	useEffect(() => {
		if (window.electronAPI) {
			setApi(window.electronAPI);
		} else {
			setApi(createFallbackAPI());
		}
		setApiReady(true);
	}, []);

	const orderedColumns = useMemo(
		() => columnOrder.map((k) => COLUMN_CONFIGS[k]),
		[columnOrder]
	);
	const visibleColumns = useMemo(
		() =>
			orderedColumns.filter(
				(col) => !col.hideable || columnVisibility[col.key as keyof ColumnVisibilityState]
			),
		[orderedColumns, columnVisibility]
	);

	const filesToSort = useMemo(
		() => (searchText ? filteredFiles : files),
		[searchText, filteredFiles, files]
	);

	const sortedFiles = useMemo(() => {
		if (!sortConfig) return filesToSort;
		return [...filesToSort].sort((a, b) => {
			const aVal = a[sortConfig.key] as string | number;
			const bVal = b[sortConfig.key] as string | number;
			if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
			return 0;
		});
	}, [filesToSort, sortConfig]);

	// Pre-compute filePath→originalFile map
	const filePathToOriginal = useMemo(() => {
		const map = new Map<string, Wavedata>();
		originalFiles.forEach((f) => map.set(f.filePath, f));
		return map;
	}, [originalFiles]);

	// Ordered list of visible file paths (used for selection ranges and arrow-key nav).
	const orderedPaths = useMemo(
		() => sortedFiles.map((f) => f.filePath),
		[sortedFiles]
	);

	// O(1) selection lookup in the row map.
	const selectedSet = useMemo(() => new Set(selectedRows), [selectedRows]);

	const selectAllVisibleRows = useCallback(() => {
		useStore.getState().setSelectedRows(orderedPaths);
		setContextMenu(null);
	}, [orderedPaths]);

	const clearSelectedRows = useCallback(() => {
		useStore.getState().setSelectedRows([]);
		setContextMenu(null);
	}, []);

	// IPC listeners
	useEffect(() => {
		if (!apiReady || !api) return;
		const unsubProgress = api.onProgressUpdate((data: LoadingProgress) => {
			useStore.getState().setLoadingProgress(data);
		});
		const unsubStatus = api.onAgentStatusChange((statuses: AgentStatus[]) => {
			useStore.getState().setAgentStatuses(statuses);
		});
		const unsubFileChanged = api.onFileChanged(async (changedPath: string) => {
			// Re-read metadata for externally changed files
			const currentFiles = useStore.getState().files;
			const matchingFile = currentFiles.find((f) => f.filePath === changedPath);
			if (matchingFile) {
				try {
					const updated = await api.readMetadata(changedPath);
					if (updated) {
						useStore.getState().batchUpdateMetadata([{ filePath: changedPath, data: updated }]);
					}
				} catch (err) {
					console.warn(`Failed to re-read externally changed file: ${changedPath}`, err);
				}
			}
		});
		return () => { unsubProgress?.(); unsubStatus?.(); unsubFileChanged?.(); };
	}, [apiReady, api]);

	// Shared directory open logic (used by keyboard shortcuts and TopBar)
	const openDirectoryViaDialog = useCallback(async () => {
		if (!api) return;
		const result = await api.showOpenDialog();
		if (result && !result.canceled && result.filePaths.length > 0) {
			try {
				useStore.getState().setIsLoading(true);
				useStore.getState().setLoadingProgress(null);
				const loadedFiles = await api.scanDirectory(result.filePaths[0]);
				useStore.getState().setFiles(loadedFiles);
			} catch (err) {
				useStore.getState().setError(`Failed to load directory: ${(err as Error).message}`);
			} finally {
				useStore.getState().setLoadingProgress(null);
				useStore.getState().setIsLoading(false);
			}
		}
	}, [api]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const activeEl = document.activeElement as HTMLElement | null;
			const isTyping = !!(activeEl && (
				activeEl.tagName === 'INPUT' ||
				activeEl.tagName === 'TEXTAREA' ||
				activeEl.tagName === 'SELECT' ||
				activeEl.isContentEditable ||
				activeEl.closest('[role="dialog"]')
			));

			if (isTyping) return;

			const isMod = event.metaKey || event.ctrlKey;
			if (isMod) {
				switch (event.key.toLowerCase()) {
					case 'z': event.preventDefault(); event.shiftKey ? useStore.getState().redo() : useStore.getState().undo(); return;
					case 's': event.preventDefault(); useStore.getState().saveAllChanges(); return;
					case 'o': event.preventDefault(); openDirectoryViaDialog(); return;
					case 'm': event.preventDefault(); if (files.length > 0) setIsMirrorModalOpen(true); return;
					case 'e': event.preventDefault(); if (files.length > 0) setIsMappingModalOpen(true); return;
					case 'a':
						event.preventDefault();
						selectAllVisibleRows();
						return;
					case '/': event.preventDefault(); setIsShortcutsModalOpen(true); return;
				}
			}

			const selectedPaths = selectedRows;
			switch (event.key) {
				case 'ArrowDown': {
					event.preventDefault();
					if (orderedPaths.length === 0) return;
					const anchor = lastAnchorRef.current;
					let nextIdx: number;
					if (anchor && orderedPaths.includes(anchor)) {
						nextIdx = Math.min(orderedPaths.indexOf(anchor) + 1, orderedPaths.length - 1);
					} else if (selectedPaths.length > 0) {
						const lastPath = selectedPaths[selectedPaths.length - 1];
						const lastIdx = orderedPaths.indexOf(lastPath);
						nextIdx = Math.min((lastIdx < 0 ? -1 : lastIdx) + 1, orderedPaths.length - 1);
					} else {
						nextIdx = 0;
					}
					const nextPath = orderedPaths[nextIdx];
					if (!nextPath) return;
					if (event.shiftKey && anchor) {
						useStore.getState().selectRange(anchor, nextPath, orderedPaths);
					} else {
						useStore.getState().selectFile(nextPath, false, false);
						lastAnchorRef.current = nextPath;
					}
					break;
				}
				case 'ArrowUp': {
					event.preventDefault();
					if (orderedPaths.length === 0) return;
					const anchor = lastAnchorRef.current;
					let prevIdx: number;
					if (anchor && orderedPaths.includes(anchor)) {
						prevIdx = Math.max(orderedPaths.indexOf(anchor) - 1, 0);
					} else if (selectedPaths.length > 0) {
						const firstPath = selectedPaths[0];
						const firstIdx = orderedPaths.indexOf(firstPath);
						prevIdx = Math.max((firstIdx < 0 ? orderedPaths.length : firstIdx) - 1, 0);
					} else {
						prevIdx = orderedPaths.length - 1;
					}
					const prevPath = orderedPaths[prevIdx];
					if (!prevPath) return;
					if (event.shiftKey && anchor) {
						useStore.getState().selectRange(anchor, prevPath, orderedPaths);
					} else {
						useStore.getState().selectFile(prevPath, false, false);
						lastAnchorRef.current = prevPath;
					}
					break;
				}
				case ' ': {
					event.preventDefault();
					const store = useStore.getState();
					if (selectedPaths.length > 0) {
						const selectedFile = files.find((f) => f.filePath === selectedPaths[0]);
						if (selectedFile) {
							if (currentFile?.filePath === selectedFile.filePath) store.togglePlayPause();
							else store.loadAudioFile(selectedFile);
							store.setPlayerMinimized(false);
						}
					} else store.togglePlayPause();
					break;
				}
				case 'Enter':
					event.preventDefault();
					WaveSurferController.getInstance().stop();
					useStore.getState().stopAudio();
					break;
			}
		};
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [files, selectedRows, currentFile, orderedPaths, openDirectoryViaDialog, selectAllVisibleRows]);

	// Scroll tracking
	useEffect(() => {
		const handleScroll = () => {
			const container = tableContainerRef.current;
			if (!container) return;
			setScrollState({ isScrolled: container.scrollTop > 20 });
		};
		const throttledScroll = throttle(handleScroll, 16);
		const container = tableContainerRef.current;
		container?.addEventListener('scroll', throttledScroll, { passive: true });
		return () => { container?.removeEventListener('scroll', throttledScroll); };
	}, []);

	// Close menus on click outside
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			const target = e.target as Element;
			if (contextMenu && !target.closest('[data-context-menu]')) setContextMenu(null);
			if (columnContextMenu && !target.closest('[data-column-context-menu]')) setColumnContextMenu(null);
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [contextMenu, columnContextMenu]);

	const handleOpenDirectory = openDirectoryViaDialog;

	const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		dragCounterRef.current = 0;
		setDragCounter(0);
		if (!api) return;
		useStore.getState().setIsLoading(true);
		useStore.getState().setLoadingProgress(null);
		try {
			const droppedItems = Array.from(e.dataTransfer.files);
			const filesToAdd: Wavedata[] = [];
			const errors: string[] = [];
			for (const item of droppedItems) {
				try {
					const itemPath = api.getPathForFile(item);
					const isDirectory = await api.checkIsDirectory(itemPath);
					if (isDirectory) {
						filesToAdd.push(...(await api.scanDirectory(itemPath)));
					} else if (item.name.toLowerCase().endsWith('.wav')) {
						const wavedata = await api.readMetadata(itemPath);
						if (wavedata) filesToAdd.push(wavedata);
					}
				} catch (err) {
					errors.push(`${item.name}: ${(err as Error).message}`);
				}
			}
			const existingPaths = new Set(files.map((f) => f.filePath));
			const newFiles = filesToAdd.filter((f) => !existingPaths.has(f.filePath));
			if (newFiles.length > 0) useStore.getState().addFiles(newFiles);
			if (errors.length > 0) {
				const loaded = filesToAdd.length;
				useStore.getState().setError(
					`Loaded ${loaded} file${loaded !== 1 ? 's' : ''}, but ${errors.length} failed:\n${errors.join('\n')}`
				);
			} else if (filesToAdd.length === 0) {
				useStore.getState().setError(
					'No supported files found. Only .wav files and folders are accepted.'
				);
			}
		} catch (err) {
			useStore.getState().setError(`Error processing dropped files: ${(err as Error).message}`);
		} finally {
			useStore.getState().setLoadingProgress(null);
			useStore.getState().setIsLoading(false);
		}
	}, [api, files]);

	const handleSort = useCallback((key: keyof Wavedata) => {
		setSortConfig((current) => ({
			key,
			direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
		}));
	}, []);

	const handleCellEdit = useCallback((filePath: string, field: keyof Wavedata, value: string) => {
		useStore.getState().updateFileMetadata(filePath, field, value);
	}, []);

	const handlePlayAudio = useCallback((file: Wavedata, e: React.MouseEvent | React.KeyboardEvent) => {
		e.stopPropagation();
		const store = useStore.getState();
		if (currentFile?.filePath === file.filePath) store.togglePlayPause();
		else store.loadAudioFile(file);
		store.setPlayerMinimized(false);
	}, [currentFile]);

	// Row selection handler — uses filePath and tracks anchor for range-select symmetry.
	const handleRowSelect = useCallback(
		(filePath: string, ctrlKey: boolean, shiftKey: boolean) => {
			const store = useStore.getState();
			if (shiftKey && lastAnchorRef.current) {
				store.selectRange(lastAnchorRef.current, filePath, orderedPaths);
				return;
			}
			store.selectFile(filePath, ctrlKey, false);
			lastAnchorRef.current = filePath;
		},
		[orderedPaths]
	);

	const handleFilenameMapping = useCallback((mapping: Record<number, string>) => {
		const pathsToProcess = selectedRows.length > 0 ? selectedRows : files.map((f) => f.filePath);
		const fileByPath = new Map(files.map((f) => [f.filePath, f]));
		const updates = pathsToProcess
			.map((filePath) => {
				const file = fileByPath.get(filePath);
				if (!file) return null;
				const parts = basename(file.filePath).replace(/\.wav$/i, '').split('_');
				const data: Partial<Wavedata> = {};
				parts.forEach((part, i) => {
					const field = mapping[i];
					if (!field || field === 'ignore') return;
					const trimmed = part.trim();
					if (!trimmed) return;
					if (['show', 'category', 'subcategory', 'scene', 'slate', 'take'].includes(field)) {
						(data as Record<string, string>)[field] = trimmed;
					}
				});
				return Object.keys(data).length > 0 ? { filePath: file.filePath, data } : null;
			})
			.filter((u): u is { filePath: string; data: Partial<Wavedata> } => u !== null);
		if (updates.length > 0) useStore.getState().batchUpdateMetadata(updates);
		setIsMappingModalOpen(false);
	}, [files, selectedRows]);

	const handleContextMenu = useCallback((e: React.MouseEvent, filePath: string) => {
		e.preventDefault();
		e.stopPropagation();
		setContextMenu({ x: e.clientX, y: e.clientY, filePath });
	}, []);

	const handleRemoveFile = useCallback(() => {
		if (!contextMenu) return;
		const paths = selectedRows.includes(contextMenu.filePath)
			? selectedRows
			: [contextMenu.filePath];
		useStore.getState().removeFilesByPath(paths);
		setContextMenu(null);
	}, [contextMenu, selectedRows]);

	const handleCopyFilepath = useCallback(() => {
		if (!contextMenu) return;
		navigator.clipboard.writeText(contextMenu.filePath);
		setContextMenu(null);
	}, [contextMenu]);

	const handleSelectAll = useCallback(() => {
		selectAllVisibleRows();
	}, [selectAllVisibleRows]);

	const handleDeselectAll = useCallback(() => {
		clearSelectedRows();
	}, [clearSelectedRows]);

	const handleColumnContextMenu = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setColumnContextMenu({ x: e.clientX, y: e.clientY });
	}, []);

	// Column drag handlers
	const handleColumnDragStart = useCallback((e: React.DragEvent, idx: number) => {
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', idx.toString());
		e.dataTransfer.setData('application/column-reorder', 'true');
		setDragState({ isDragging: true, draggedColumnIndex: idx, dropTargetIndex: null });
	}, []);

	const handleColumnHeaderDragOver = useCallback(
		(e: React.DragEvent<HTMLTableCellElement>) => {
			e.preventDefault();
			const targetEl = e.currentTarget as HTMLElement;
			const idxAttr = targetEl.dataset.colIdx;
			const idx = idxAttr ? parseInt(idxAttr, 10) : -1;
			if (idx >= 0) {
				setDragState((p) => (p.dropTargetIndex === idx ? p : { ...p, dropTargetIndex: idx }));
			}
		},
		[]
	);

	const handleColumnDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
		e.preventDefault();
		const dragIdx = parseInt(e.dataTransfer.getData('text/plain'));
		if (dragIdx !== dropIdx) {
			const dragCol = visibleColumns[dragIdx];
			const dropCol = visibleColumns[dropIdx];
			if (dragCol && dropCol) {
				const from = columnOrder.indexOf(dragCol.key);
				const to = columnOrder.indexOf(dropCol.key);
				if (from !== -1 && to !== -1) useStore.getState().reorderColumns(from, to);
			}
		}
		setDragState({ isDragging: false, draggedColumnIndex: null, dropTargetIndex: null });
	}, [visibleColumns, columnOrder]);

	// Drop-zone handlers: track counter via ref to avoid stale closures.
	const handleContainerDragOver = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			const types = e.dataTransfer?.types;
			if (types) {
				if (types.includes && types.includes('application/column-reorder')) {
					e.dataTransfer.dropEffect = 'none';
				} else if (types.includes && types.includes('Files')) {
					e.dataTransfer.dropEffect = 'copy';
				} else {
					e.dataTransfer.dropEffect = 'none';
				}
			}
		},
		[]
	);

	const handleContainerDragEnter = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			if (e.dataTransfer?.types && (e.dataTransfer.types as unknown as string[]).includes?.('application/column-reorder')) {
				return;
			}
			dragCounterRef.current += 1;
			if (dragCounterRef.current === 1) setDragCounter(1);
		},
		[]
	);

	const handleContainerDragLeave = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			if (e.dataTransfer?.types && (e.dataTransfer.types as unknown as string[]).includes?.('application/column-reorder')) {
				return;
			}
			dragCounterRef.current -= 1;
			if (dragCounterRef.current <= 0) {
				dragCounterRef.current = 0;
				setDragCounter(0);
			}
		},
		[]
	);

	if (!apiReady || !api) {
		return <AppContainer><GlobalStyles /><Spinner /></AppContainer>;
	}

	const firstSelectedPath = selectedRows[0];
	const firstSelectedFile = firstSelectedPath
		? files.find((f) => f.filePath === firstSelectedPath)
		: undefined;

	const fileWatcherActive = agentStatuses.some(
		(a) => a.name === 'file-watcher' && a.active
	);

	return (
		<AppContainer
			onDragOver={handleContainerDragOver}
			onDrop={handleDrop}
			onDragEnter={handleContainerDragEnter}
			onDragLeave={handleContainerDragLeave}>
			<GlobalStyles />

			{error && <ErrorDialog message={error} onClose={() => useStore.getState().clearError()} />}
			{isLoading && <Spinner />}

			<FilenameMappingModal
				isOpen={isMappingModalOpen}
				onClose={() => setIsMappingModalOpen(false)}
				onApply={handleFilenameMapping}
				sampleFilename={
					firstSelectedFile
						? basename(firstSelectedFile.filePath)
						: files.length > 0 ? basename(files[0].filePath) : 'example_file_name.wav'
				}
			/>
			<MirrorModal
				isOpen={isMirrorModalOpen}
				onClose={() => setIsMirrorModalOpen(false)}
				selectedFiles={selectedRows}
				allFiles={files}
				totalFiles={files.length}
			/>
			<SettingsModal
				isOpen={isSettingsModalOpen}
				onClose={() => setIsSettingsModalOpen(false)}
				isDarkMode={settings.isDarkMode}
				onThemeToggle={useStore.getState().toggleDarkMode}
				fontSize={settings.fontSize}
				onFontSizeChange={useStore.getState().setFontSize}
				showTooltips={settings.showTooltips}
				onTooltipsToggle={useStore.getState().toggleTooltips}
				fileWatcherActive={fileWatcherActive}
				onFileWatcherToggle={() => {
					const watcher = useStore.getState().agentStatuses.find((a) => a.name === 'file-watcher');
					api?.toggleAgent('file-watcher', !watcher?.active).catch(console.error);
				}}
			/>

			{dragCounter > 0 && <DragOverlay />}

			<TopBar
				searchText={searchText}
				searchField={searchField}
				onSearchChange={(text) => useStore.getState().setSearch(text)}
				onSearchFieldChange={(text, field) => useStore.getState().setSearch(text, field)}
				onOpenDirectory={handleOpenDirectory}
				onOpenExtract={() => setIsMappingModalOpen(true)}
				onEmbed={() => useStore.getState().saveAllChanges()}
				onOpenMirror={() => setIsMirrorModalOpen(true)}
				onOpenSettings={() => setIsSettingsModalOpen(true)}
				hasFiles={files.length > 0}
				isDirty={isDirty}
				statusBar={<AgentStatusBar />}
			/>
			<ProgressBar />

			<TableContainer ref={tableContainerRef}>
				{sortedFiles.length === 0 && !isLoading ? (
					<EmptyState onOpenDirectory={handleOpenDirectory} />
				) : (
					<Table role="grid" aria-rowcount={sortedFiles.length}>
						<thead>
							<tr>
								{visibleColumns.map((column, colIdx) => (
									<TableHeader
										key={column.key}
										data-col-idx={colIdx}
										isScrolled={scrollState.isScrolled}
										draggable={column.hideable}
										style={{
											width: column.width,
											textAlign: column.key === 'audio' ? 'center' : 'left',
											opacity: dragState.draggedColumnIndex === colIdx ? 0.5 : 1,
											backgroundColor: dragState.dropTargetIndex === colIdx ? 'rgba(0, 122, 255, 0.2)' : undefined,
											cursor: column.hideable ? 'move' : 'pointer',
										}}
										onClick={column.sortable ? () => handleSort(column.key as keyof Wavedata) : undefined}
										onContextMenu={column.hideable ? handleColumnContextMenu : undefined}
										onDragStart={column.hideable ? (e) => handleColumnDragStart(e, colIdx) : undefined}
										onDragOver={column.hideable ? handleColumnHeaderDragOver : undefined}
										onDrop={column.hideable ? (e) => handleColumnDrop(e, colIdx) : undefined}
										onDragEnd={() => setDragState({ isDragging: false, draggedColumnIndex: null, dropTargetIndex: null })}>
										{column.label}
										{column.sortable && sortConfig?.key === column.key && (
											<SortIndicator>{sortConfig.direction === 'asc' ? <SortAscIcon /> : <SortDescIcon />}</SortIndicator>
										)}
									</TableHeader>
								))}
							</tr>
						</thead>
						<tbody>
							{sortedFiles.map((file, visibleIndex) => {
								const originalFile = filePathToOriginal.get(file.filePath);

								return (
									<MetadataTableRow
										key={file.filePath}
										file={file}
										originalFile={originalFile}
										rowIndex={visibleIndex}
										isSelected={selectedSet.has(file.filePath)}
										isCurrentPlaying={currentFile?.filePath === file.filePath && isPlaying}
										visibleColumns={visibleColumns}
										onSelect={handleRowSelect}
										onContextMenu={handleContextMenu}
										onCellEdit={handleCellEdit}
										onPlayAudio={handlePlayAudio}
									/>
								);
							})}
						</tbody>
					</Table>
				)}
			</TableContainer>

			<KeyboardShortcutsModal
				isOpen={isShortcutsModalOpen}
				onClose={() => setIsShortcutsModalOpen(false)}
			/>

			<AudioPlayer />

			{/* File Context Menu */}
			{contextMenu && createPortal(
				<ContextMenu top={contextMenu.y} left={contextMenu.x} data-context-menu>
					<ContextMenuItem onClick={handleCopyFilepath} data-context-menu>
						Copy filepath
					</ContextMenuItem>
					<ContextMenuItem onClick={handleSelectAll} data-context-menu>
						Select all
						<ContextMenuShortcut>Cmd+A</ContextMenuShortcut>
					</ContextMenuItem>
					{selectedRows.length > 0 && (
						<ContextMenuItem onClick={handleDeselectAll} data-context-menu>
							Deselect all
						</ContextMenuItem>
					)}
					<ContextMenuSeparator />
					<ContextMenuItem danger onClick={handleRemoveFile} data-context-menu>
						{selectedRows.includes(contextMenu.filePath) && selectedRows.length > 1
							? `Remove ${selectedRows.length} files`
							: 'Remove file'}
						<ContextMenuShortcut>Del</ContextMenuShortcut>
					</ContextMenuItem>
				</ContextMenu>,
				document.body
			)}

			{/* Column Header Context Menu */}
			{columnContextMenu && createPortal(
				<ContextMenu top={columnContextMenu.y} left={columnContextMenu.x} data-column-context-menu>
					{orderedColumns.filter((c) => c.hideable).map((column) => (
						<ContextMenuItem
							key={column.key}
							onClick={() => { useStore.getState().toggleColumnVisibility(column.key as keyof ColumnVisibilityState); setColumnContextMenu(null); }}
							data-column-context-menu>
							<CheckboxIcon checked={!!columnVisibility[column.key as keyof ColumnVisibilityState]} color="var(--accent-primary)" />
							{column.label}
						</ContextMenuItem>
					))}
					<ContextMenuItem onClick={() => { useStore.getState().resetColumnVisibility(); setColumnContextMenu(null); }} data-column-context-menu
						style={{ borderTop: '1px solid var(--border-secondary)', marginTop: '4px', paddingTop: '8px' }}>
						Reset Column Visibility
					</ContextMenuItem>
					<ContextMenuItem onClick={() => { useStore.getState().resetColumnOrder(); setColumnContextMenu(null); }} data-column-context-menu>
						Reset Column Order
					</ContextMenuItem>
				</ContextMenu>,
				document.body
			)}
		</AppContainer>
	);
};
