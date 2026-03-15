import { createWithEqualityFn } from 'zustand/traditional';
import {
	Wavedata,
	AgentStatus,
	MetadataEditCommand,
} from '../types';
import { filterFiles } from './store/filterUtils';

export interface LoadingProgress {
	fileName: string;
	percentage: number;
	processed: number;
	total: number;
}

export interface AudioPlayerState {
	currentFile: Wavedata | null;
	isPlaying: boolean;
	isPaused: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMinimized: boolean;
	waveformReady: boolean;
	isLoading: boolean;
	error?: string | null;
}

export interface SettingsState {
	isDarkMode: boolean;
	fontSize: string;
	showTooltips: boolean;
}

export interface ColumnVisibilityState {
	filename: boolean;
	show: boolean;
	category: boolean;
	subcategory: boolean;
	scene: boolean;
	take: boolean;
	ixmlNote: boolean;
	duration: boolean;
	fileSize: boolean;
}

export type ColumnKey =
	| 'audio'
	| 'filename'
	| 'show'
	| 'category'
	| 'subcategory'
	| 'scene'
	| 'take'
	| 'ixmlNote'
	| 'duration'
	| 'fileSize';

// Exporting AppState to be used in components for type safety.
export interface AppState {
	files: Wavedata[];
	originalFiles: Wavedata[];
	audioDataCache: Map<string, ArrayBuffer>;
	loadingProgress: LoadingProgress | null;
	agentStatuses: AgentStatus[];
	isDirty: boolean;
	isSaving: boolean;
	isLoading: boolean;
	error: string | null;
	history: MetadataEditCommand[];
	historyIndex: number;
	searchText: string;
	searchField: string;
	filteredFiles: Wavedata[];
	selectedRows: number[];

	// Column Visibility State
	columnVisibility: ColumnVisibilityState;
	columnOrder: ColumnKey[];

	// Audio Player State
	audioPlayer: AudioPlayerState;

	// Settings State
	settings: SettingsState;

	addFiles: (files: Wavedata[]) => void;
	setFiles: (files: Wavedata[]) => void;
	setIsLoading: (isLoading: boolean) => void;
	setSearch: (searchText: string, searchField?: string) => void;
	removeFiles: (indices: number[]) => void;
	updateFileMetadata: (
		filePath: string,
		field: keyof Wavedata,
		value: any
	) => void;
	batchUpdateMetadata: (
		updates: Array<{ filePath: string; data: Partial<Wavedata> }>
	) => void;
	batchUpdateFromFilename: (updates: Partial<Wavedata>[]) => void;
	selectFile: (index: number, ctrlKey: boolean, shiftKey: boolean) => void;
	setLoadingProgress: (progress: LoadingProgress | null) => void;
	setAgentStatuses: (statuses: AgentStatus[]) => void;
	getAgentStatus: (name: string) => AgentStatus | undefined;
	saveAllChanges: () => Promise<void>;
	setError: (error: string | null) => void;
	clearError: () => void;
	undo: () => void;
	redo: () => void;

	// Audio Player Actions
	loadAudioFile: (file: Wavedata) => Promise<void>;
	togglePlayPause: () => void;
	stopAudio: () => void;
	setCurrentTime: (time: number) => void;
	setVolume: (volume: number) => void;
	setPlayerMinimized: (minimized: boolean) => void;
	setWaveformReady: (ready: boolean) => void;
	setPlayerLoading: (loading: boolean) => void;
	setDuration: (duration: number) => void;

	// Audio Data Cache Actions
	addAudioDataToCache: (filePath: string, data: ArrayBuffer) => void;
	getAudioDataFromCache: (filePath: string) => ArrayBuffer | undefined;

	// Settings Actions
	toggleDarkMode: () => void;
	setFontSize: (size: string) => void;
	toggleTooltips: () => void;
	loadSettings: () => void;
	saveSettings: () => void;

	// Column Visibility Actions
	toggleColumnVisibility: (column: keyof ColumnVisibilityState) => void;
	resetColumnVisibility: () => void;

	// Column Order Actions
	reorderColumns: (fromIndex: number, toIndex: number) => void;
	resetColumnOrder: () => void;
}

// Settings persistence helpers
const SETTINGS_STORAGE_KEY = 'metadata-editor-settings';

const getDefaultSettings = (): SettingsState => ({
	isDarkMode: false,
	fontSize: '11',
	showTooltips: true,
});

const getDefaultColumnVisibility = (): ColumnVisibilityState => ({
	filename: true,
	show: true,
	category: true,
	subcategory: true,
	scene: true,
	take: true,
	ixmlNote: true,
	duration: true,
	fileSize: true,
});

const getDefaultColumnOrder = (): ColumnKey[] => [
	'audio',
	'filename',
	'show',
	'category',
	'subcategory',
	'scene',
	'take',
	'ixmlNote',
	'duration',
	'fileSize',
];

const loadSettingsFromStorage = (): SettingsState => {
	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...getDefaultSettings(), ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}
	return getDefaultSettings();
};

const saveSettingsToStorage = (settings: SettingsState) => {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
};

// Column persistence
const COLUMNS_STORAGE_KEY = 'metadata-editor-columns';

interface ColumnPersistence {
	visibility: ColumnVisibilityState;
	order: ColumnKey[];
}

const loadColumnsFromStorage = (): ColumnPersistence => {
	try {
		const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<ColumnPersistence>;
			return {
				visibility: { ...getDefaultColumnVisibility(), ...(parsed.visibility ?? {}) },
				order: Array.isArray(parsed.order) ? parsed.order : getDefaultColumnOrder(),
			};
		}
	} catch (error) {
		console.warn('Failed to load column settings from localStorage:', error);
	}
	return { visibility: getDefaultColumnVisibility(), order: getDefaultColumnOrder() };
};

const saveColumnsToStorage = (visibility: ColumnVisibilityState, order: ColumnKey[]) => {
	try {
		localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify({ visibility, order }));
	} catch (error) {
		console.warn('Failed to save column settings to localStorage:', error);
	}
};

export const useStore = createWithEqualityFn<AppState>(
	(set, get) => ({
		files: [],
		originalFiles: [],
		audioDataCache: new Map(),
		loadingProgress: null,
		agentStatuses: [],
		isDirty: false,
		isSaving: false,
		isLoading: false,
		error: null,
		history: [],
		historyIndex: -1,
		searchText: '',
		searchField: 'all',
		filteredFiles: [],
		selectedRows: [],
		...(() => {
			const { visibility, order } = loadColumnsFromStorage();
			return { columnVisibility: visibility, columnOrder: order };
		})(),
		audioPlayer: {
			currentFile: null,
			isPlaying: false,
			isPaused: true,
			currentTime: 0,
			duration: 0,
			volume: 0.5,
			isMinimized: true,
			waveformReady: false,
			isLoading: false,
		},
		settings: loadSettingsFromStorage(),

		addFiles: (files) => {
			set((state) => {
				// Filter out duplicates based on filePath
				const existingFilePaths = new Set(
					state.files.map((file) => file.filePath)
				);
				const newFiles = files.filter(
					(file) => !existingFilePaths.has(file.filePath)
				);

				if (newFiles.length === 0) {
					return state; // No new files to add
				}

				return {
					files: [...state.files, ...newFiles],
					originalFiles: [...state.originalFiles, ...newFiles],
				};
			});
			// Re-apply the current search filter to include new files
			get().setSearch(get().searchText, get().searchField);
		},

		setFiles: (files) => {
			const deepCopiedFiles = JSON.parse(JSON.stringify(files));
			set({
				files,
				originalFiles: deepCopiedFiles,
				isDirty: false,
				selectedRows: [],
				history: [],
				historyIndex: -1,
			});
			get().setSearch(get().searchText, get().searchField); // Re-apply filter
		},

		setIsLoading: (isLoading) => set({ isLoading }),

		setSearch: (searchText, searchField) => {
			const state = get();
			const newSearchField = searchField || state.searchField;
			set({
				searchText,
				searchField: newSearchField,
				filteredFiles: filterFiles(state.files, searchText, newSearchField),
			});
		},

		removeFiles: (indices) =>
			set((state) => {

				// Get file paths for files being removed (for cache cleanup and audio player)
				const removedFiles = indices.map((i) => state.files[i]).filter(Boolean);
				const removedFilePaths = new Set(removedFiles.map((f) => f.filePath));

				// Filter out removed files from both arrays
				const newFiles = state.files.filter((_, i) => !indices.includes(i));
				const newOriginalFiles = state.originalFiles.filter(
					(file) => !removedFilePaths.has(file.filePath)
				);

				// Clean up audio cache for removed files
				const newAudioCache = new Map(state.audioDataCache);
				removedFilePaths.forEach((filePath) => {
					newAudioCache.delete(filePath);
				});

				// Clear selected rows since indices will change
				const newSelectedRows: number[] = [];

				// Re-apply current search filter
				const filteredFiles = filterFiles(newFiles, state.searchText, state.searchField);

				// Handle audio player state if current file is removed
				const currentFile = state.audioPlayer.currentFile;
				let newAudioPlayerState = state.audioPlayer;

				if (currentFile && removedFilePaths.has(currentFile.filePath)) {
					newAudioPlayerState = {
						...state.audioPlayer,
						currentFile: null,
						isPlaying: false,
						isPaused: true,
						currentTime: 0,
						duration: 0,
						waveformReady: false,
						isLoading: false,
					};
				}

				return {
					files: newFiles,
					originalFiles: newOriginalFiles,
					audioDataCache: newAudioCache,
					selectedRows: newSelectedRows,
					filteredFiles,
					audioPlayer: newAudioPlayerState,
				};
			}),

		updateFileMetadata: (filePath, field, value) =>
			set((state) => {
				const fileToUpdate = state.files.find((f) => f.filePath === filePath);
				if (!fileToUpdate) return {};

				const oldValue = fileToUpdate[field];

				// Create a command for the history
				const command: MetadataEditCommand = {
					filePath,
					field,
					oldValue,
					newValue: value,
				};

				// Add to history, clearing any future redos
				const newHistory = [
					...state.history.slice(0, state.historyIndex + 1),
					command,
				];

				const newFiles = state.files.map((file) =>
					file.filePath === filePath
						? { ...file, [field]: value, lastModified: Date.now() }
						: file
				);

				return {
					files: newFiles,
					filteredFiles: filterFiles(newFiles, state.searchText, state.searchField),
					isDirty: true,
					history: newHistory,
					historyIndex: newHistory.length - 1,
				};
			}),

		batchUpdateMetadata: (
			updates: Array<{ filePath: string; data: Partial<Wavedata> }>
		) =>
			set((state) => {
				const newFiles = [...state.files];
				updates.forEach(({ filePath, data }) => {
					const fileIndex = newFiles.findIndex((f) => f.filePath === filePath);
					if (fileIndex > -1) {
						newFiles[fileIndex] = {
							...newFiles[fileIndex],
							...data,
							lastModified: Date.now(),
						};
					}
				});
				return {
					files: newFiles,
					filteredFiles: filterFiles(newFiles, state.searchText, state.searchField),
					isDirty: true,
				};
			}),

		batchUpdateFromFilename: (updates) =>
			set((state) => {
				const updatedFiles = state.files.map((file) => {
					const update = updates.find((u) => u.filePath === file.filePath);
					if (update) {
						return {
							...file,
							...update,
							lastModified: Date.now(),
						};
					}
					return file;
				});

				return {
					files: updatedFiles,
					filteredFiles: filterFiles(updatedFiles, state.searchText, state.searchField),
					isDirty: true,
				};
			}),

		selectFile: (index, ctrlKey, shiftKey) =>
			set((state) => {
				const currentSelection = [...state.selectedRows];
				const lastSelected =
					currentSelection.length > 0
						? currentSelection[currentSelection.length - 1]
						: -1;

				if (shiftKey && lastSelected !== -1) {
					const start = Math.min(lastSelected, index);
					const end = Math.max(lastSelected, index);
					const selection = Array.from(
						{ length: end - start + 1 },
						(_, i) => start + i
					);
					return { selectedRows: selection };
				} else if (ctrlKey) {
					const indexInSelection = currentSelection.indexOf(index);
					if (indexInSelection > -1) {
						currentSelection.splice(indexInSelection, 1);
					} else {
						currentSelection.push(index);
					}
					return { selectedRows: currentSelection };
				} else {
					return { selectedRows: [index] };
				}
			}),

		setLoadingProgress: (progress) => set({ loadingProgress: progress }),

		setAgentStatuses: (statuses) => set({ agentStatuses: statuses }),

		getAgentStatus: (name: string) => {
			return get().agentStatuses.find((agent) => agent.name === name);
		},

		saveAllChanges: async () => {
			const { files, isDirty } = get();
			if (!isDirty) return;

			set({ isSaving: true, error: null });

			try {
				const dirtyFiles = files.filter((f) => f.lastModified);
				await Promise.all(
					dirtyFiles.map((file) =>
						window.electronAPI.writeMetadata(file.filePath, file)
					)
				);

				set((state) => ({
					isSaving: false,
					isDirty: false,
					files: state.files.map((f) => ({ ...f, lastModified: undefined })),
					originalFiles: JSON.parse(JSON.stringify(state.files)),
				}));
			} catch (error) {
				console.error('Failed to save changes:', error);
				set({
					isSaving: false,
					error: `Failed to save changes: ${
						error instanceof Error ? error.message : String(error)
					}`,
				});
			}
		},

		setError: (error: string | null) => set({ error }),
		clearError: () => set({ error: null }),

		undo: () =>
			set((state) => {
				if (state.historyIndex < 0) return {};

				const command = state.history[state.historyIndex];
				const { filePath, field, oldValue } = command;

				const newFiles = state.files.map((file) =>
					file.filePath === filePath ? { ...file, [field]: oldValue } : file
				);

				return {
					files: newFiles,
					filteredFiles: filterFiles(newFiles, state.searchText, state.searchField),
					historyIndex: state.historyIndex - 1,
					isDirty: true,
				};
			}),

		redo: () =>
			set((state) => {
				if (state.historyIndex >= state.history.length - 1) return {};

				const command = state.history[state.historyIndex + 1];
				const { filePath, field, newValue } = command;

				const newFiles = state.files.map((file) =>
					file.filePath === filePath ? { ...file, [field]: newValue } : file
				);

				return {
					files: newFiles,
					filteredFiles: filterFiles(newFiles, state.searchText, state.searchField),
					historyIndex: state.historyIndex + 1,
					isDirty: true,
				};
			}),

		loadAudioFile: async (file: Wavedata) => {
			set((state) => ({
				audioPlayer: {
					...state.audioPlayer,
					currentFile: file,
					isPlaying: true, // Auto-play by default
					isPaused: false,
					currentTime: 0,
					duration: 0,
					waveformReady: false,
					isLoading: true,
					error: null,
				},
			}));

			try {
				let audioData = get().audioDataCache.get(file.filePath);
				if (!audioData) {
					audioData = await window.electronAPI.loadAudioFile(file.filePath);
				}

				set((state) => {
					const newCache = new Map(state.audioDataCache);
					newCache.set(file.filePath, audioData!);
					return {
						audioDataCache: newCache,
						audioPlayer: {
							...state.audioPlayer,
							isLoading: false,
						},
					};
				});
			} catch (error) {
				console.error('Failed to load audio file:', error);
				set((state) => ({
					audioPlayer: {
						...state.audioPlayer,
						isLoading: false,
						isPlaying: false,
						isPaused: true,
						error: `Failed to load audio: ${
							error instanceof Error ? error.message : String(error)
						}`,
					},
				}));
			}
		},

		togglePlayPause: () =>
			set((state) => {
				if (!state.audioPlayer.currentFile) return {}; // No file loaded

				const isPlaying = !state.audioPlayer.isPlaying;
				return {
					audioPlayer: {
						...state.audioPlayer,
						isPlaying,
						isPaused: !isPlaying,
					},
				};
			}),

		stopAudio: () =>
			set((state) => ({
				audioPlayer: {
					...state.audioPlayer,
					isPlaying: false,
					isPaused: true,
					currentTime: 0,
				},
			})),

		setCurrentTime: (time) =>
			set((state) => ({
				audioPlayer: { ...state.audioPlayer, currentTime: time },
			})),

		setVolume: (volume) =>
			set((state) => ({ audioPlayer: { ...state.audioPlayer, volume } })),

		setPlayerMinimized: (minimized) =>
			set((state) => ({
				audioPlayer: { ...state.audioPlayer, isMinimized: minimized },
			})),

		setWaveformReady: (ready) =>
			set((state) => ({
				audioPlayer: { ...state.audioPlayer, waveformReady: ready },
			})),

		setPlayerLoading: (loading) =>
			set((state) => ({
				audioPlayer: { ...state.audioPlayer, isLoading: loading },
			})),

		setDuration: (duration) =>
			set((state) => ({ audioPlayer: { ...state.audioPlayer, duration } })),

		// Audio Data Cache Actions (LRU eviction at ~500MB)
		addAudioDataToCache: (filePath, data) =>
			set((state) => {
				const newCache = new Map(state.audioDataCache);
				newCache.set(filePath, data);

				// LRU eviction: remove oldest entries when cache exceeds ~500MB
				const MAX_CACHE_BYTES = 500 * 1024 * 1024;
				let totalSize = 0;
				for (const [, buf] of newCache) totalSize += buf.byteLength;

				if (totalSize > MAX_CACHE_BYTES) {
					const keys = Array.from(newCache.keys());
					for (const key of keys) {
						if (key === filePath) continue; // Don't evict the one we just added
						totalSize -= newCache.get(key)!.byteLength;
						newCache.delete(key);
						if (totalSize <= MAX_CACHE_BYTES) break;
					}
				}

				return { audioDataCache: newCache };
			}),

		getAudioDataFromCache: (filePath) => {
			return get().audioDataCache.get(filePath);
		},

		// Settings Actions
		toggleDarkMode: () => {
			set((state) => {
				const newSettings = {
					...state.settings,
					isDarkMode: !state.settings.isDarkMode,
				};
				saveSettingsToStorage(newSettings);
				return { settings: newSettings };
			});
		},

		setFontSize: (size: string) => {
			set((state) => {
				const newSettings = { ...state.settings, fontSize: size };
				saveSettingsToStorage(newSettings);
				return { settings: newSettings };
			});
		},

		toggleTooltips: () => {
			set((state) => {
				const newSettings = {
					...state.settings,
					showTooltips: !state.settings.showTooltips,
				};
				saveSettingsToStorage(newSettings);
				return { settings: newSettings };
			});
		},

		loadSettings: () => {
			set({
				settings: loadSettingsFromStorage(),
			});
		},

		saveSettings: () => {
			const { settings } = get();
			saveSettingsToStorage(settings);
		},

		// Column Visibility Actions
		toggleColumnVisibility: (column: keyof ColumnVisibilityState) => {
			set((state) => {
				const newVisibility = {
					...state.columnVisibility,
					[column]: !state.columnVisibility[column],
				};
				saveColumnsToStorage(newVisibility, state.columnOrder);
				return { columnVisibility: newVisibility };
			});
		},

		resetColumnVisibility: () => {
			const defaultVis = getDefaultColumnVisibility();
			saveColumnsToStorage(defaultVis, get().columnOrder);
			set({ columnVisibility: defaultVis });
		},

		// Column Order Actions
		reorderColumns: (fromIndex: number, toIndex: number) => {
			set((state) => {
				const newOrder = [...state.columnOrder];
				const [movedColumn] = newOrder.splice(fromIndex, 1);
				newOrder.splice(toIndex, 0, movedColumn);
				saveColumnsToStorage(state.columnVisibility, newOrder);
				return { columnOrder: newOrder };
			});
		},

		resetColumnOrder: () => {
			const defaultOrder = getDefaultColumnOrder();
			saveColumnsToStorage(get().columnVisibility, defaultOrder);
			set({ columnOrder: defaultOrder });
		},
	}),
	Object.is
);
