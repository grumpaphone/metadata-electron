// NOTE: TableRenderer is responsible for arrow-key nav anchoring and ordering.
// The store tracks selection by filePath (string[]); the table knows the
// visible/sorted order and is responsible for passing orderedPaths to
// `selectRange` and managing up/down anchor symmetry.
import { createWithEqualityFn } from 'zustand/traditional';
import {
	Wavedata,
	AgentStatus,
	MetadataEditCommand,
	LoadingProgress,
} from '../types';
import { filterFiles } from './store/filterUtils';

// Re-export LoadingProgress for any consumers that still import from this module.
export type { LoadingProgress } from '../types';

export interface AudioPlayerState {
	currentFile: Wavedata | null;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isMinimized: boolean;
	waveformReady: boolean;
	isLoading: boolean;
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
	/** Selected file paths. Migrated from number[] indices in Wave 2. */
	selectedRows: string[];

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
	/** @deprecated Prefer removeFilesByPath — consumers migrating in Wave 3. */
	removeFiles: (indices: number[]) => void;
	removeFilesByPath: (paths: string[]) => void;
	updateFileMetadata: (
		filePath: string,
		field: keyof Wavedata,
		value: any
	) => void;
	batchUpdateMetadata: (
		updates: Array<{ filePath: string; data: Partial<Wavedata> }>
	) => void;
	batchUpdateFromFilename: (updates: Partial<Wavedata>[]) => void;
	selectFile: (
		filePath: string,
		multiSelect?: boolean,
		rangeSelect?: boolean
	) => void;
	selectRange: (
		fromPath: string,
		toPath: string,
		orderedPaths: string[]
	) => void;
	clearSelection: () => void;
	setSelectedRows: (paths: string[]) => void;
	setLoadingProgress: (progress: LoadingProgress | null) => void;
	setAgentStatuses: (statuses: AgentStatus[]) => void;
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

	// Settings Actions
	toggleDarkMode: () => void;
	setFontSize: (size: string) => void;
	toggleTooltips: () => void;

	// Column Visibility Actions
	toggleColumnVisibility: (column: keyof ColumnVisibilityState) => void;
	resetColumnVisibility: () => void;

	// Column Order Actions
	reorderColumns: (fromIndex: number, toIndex: number) => void;
	resetColumnOrder: () => void;
}

// Settings persistence helpers
const SETTINGS_STORAGE_KEY = 'metadata-editor-settings';

interface PersistedSettings extends SettingsState {
	volume: number;
}

const getDefaultSettings = (): SettingsState => ({
	isDarkMode: false,
	fontSize: '11',
	showTooltips: true,
});

const DEFAULT_VOLUME = 0.5;

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

const loadPersistedBlob = (): { settings: SettingsState; volume: number } => {
	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<PersistedSettings>;
			const settings: SettingsState = { ...getDefaultSettings(), ...parsed };
			const rawVolume =
				typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_VOLUME;
			const volume = Math.min(1, Math.max(0, rawVolume));
			return { settings, volume };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}
	return { settings: getDefaultSettings(), volume: DEFAULT_VOLUME };
};

const savePersistedBlob = (settings: SettingsState, volume: number) => {
	try {
		const blob: PersistedSettings = { ...settings, volume };
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(blob));
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
	const defaults = {
		visibility: getDefaultColumnVisibility(),
		order: getDefaultColumnOrder(),
	};
	try {
		const stored = localStorage.getItem(COLUMNS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<ColumnPersistence>;

			// Filter persisted visibility keys against known defaults
			const knownKeys = Object.keys(defaults.visibility) as Array<
				keyof ColumnVisibilityState
			>;
			const filteredVisibility: Partial<ColumnVisibilityState> = {};
			if (parsed.visibility && typeof parsed.visibility === 'object') {
				const src = parsed.visibility as unknown as Record<string, unknown>;
				for (const k of knownKeys) {
					const v = src[k];
					if (typeof v === 'boolean') filteredVisibility[k] = v;
				}
			}
			const visibility = { ...defaults.visibility, ...filteredVisibility };

			// Validate that the persisted order contains exactly the expected keys
			const expectedKeys = new Set(defaults.order);
			let order = defaults.order;
			if (Array.isArray(parsed.order)) {
				const parsedSet = new Set(parsed.order);
				const hasAllKeys = defaults.order.every((k) => parsedSet.has(k));
				const noExtraKeys = parsed.order.every((k: string) =>
					expectedKeys.has(k as ColumnKey)
				);
				if (
					hasAllKeys &&
					noExtraKeys &&
					parsed.order.length === defaults.order.length
				) {
					order = parsed.order;
				} else {
					console.warn(
						'Column order in localStorage is stale, resetting to defaults'
					);
				}
			}

			return { visibility, order };
		}
	} catch (error) {
		console.warn('Failed to load column settings from localStorage:', error);
	}
	return defaults;
};

const saveColumnsToStorage = (
	visibility: ColumnVisibilityState,
	order: ColumnKey[]
) => {
	try {
		localStorage.setItem(
			COLUMNS_STORAGE_KEY,
			JSON.stringify({ visibility, order })
		);
	} catch (error) {
		console.warn('Failed to save column settings to localStorage:', error);
	}
};

// Module-level counter used to invalidate stale loadAudioFile IPC responses.
let loadAudioRequestId = 0;

// Lazy stop of the WaveSurfer singleton to avoid a circular import with
// ./audio/WaveSurferController at module init time.
const stopWaveSurfer = () => {
	import('./audio/WaveSurferController')
		.then((m) => {
			const ctor = (m as any).WaveSurferController ?? (m as any).default;
			ctor?.getInstance?.().stop?.();
		})
		.catch(() => {
			/* ignore */
		});
};

export const useStore = createWithEqualityFn<AppState>(
	(set, get) => {
		const initialPersisted = loadPersistedBlob();
		return {
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
				currentTime: 0,
				duration: 0,
				volume: initialPersisted.volume,
				isMinimized: true,
				waveformReady: false,
				isLoading: false,
			},
			settings: initialPersisted.settings,

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

					const mergedFiles = [...state.files, ...newFiles];
					const mergedOriginals = [...state.originalFiles, ...newFiles];
					const filteredFiles = filterFiles(
						mergedFiles,
						state.searchText,
						state.searchField
					);
					// Paths still present are by definition all of mergedFiles; no-op filter
					// but keep semantics consistent with other mutators.
					const presentPaths = new Set(mergedFiles.map((f) => f.filePath));
					const selectedRows = state.selectedRows.filter((p) =>
						presentPaths.has(p)
					);

					return {
						files: mergedFiles,
						originalFiles: mergedOriginals,
						filteredFiles,
						selectedRows,
					};
				});
			},

			setFiles: (files) => {
				const deepCopiedFiles = structuredClone(files);
				set((state) => ({
					files,
					originalFiles: deepCopiedFiles,
					isDirty: false,
					selectedRows: [],
					history: [],
					historyIndex: -1,
					filteredFiles: filterFiles(
						files,
						state.searchText,
						state.searchField
					),
				}));
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
					const indexSet = new Set(indices);

					// Get file paths for files being removed (for cache cleanup and audio player)
					const removedFiles = indices
						.map((i) => state.files[i])
						.filter(Boolean);
					const removedFilePaths = new Set(
						removedFiles.map((f) => f.filePath)
					);

					// Filter out removed files from both arrays
					const newFiles = state.files.filter((_, i) => !indexSet.has(i));
					const newOriginalFiles = state.originalFiles.filter(
						(file) => !removedFilePaths.has(file.filePath)
					);

					// Clean up audio cache for removed files
					const newAudioCache = new Map(state.audioDataCache);
					removedFilePaths.forEach((filePath) => {
						newAudioCache.delete(filePath);
					});

					// Keep only selections for files still present
					const presentPaths = new Set(newFiles.map((f) => f.filePath));
					const newSelectedRows = state.selectedRows.filter((p) =>
						presentPaths.has(p)
					);

					// Re-apply current search filter
					const filteredFiles = filterFiles(
						newFiles,
						state.searchText,
						state.searchField
					);

					// Handle audio player state if current file is removed
					const currentFile = state.audioPlayer.currentFile;
					let newAudioPlayerState = state.audioPlayer;

					if (currentFile && removedFilePaths.has(currentFile.filePath)) {
						stopWaveSurfer();
						newAudioPlayerState = {
							currentFile: null,
							isPlaying: false,
							currentTime: 0,
							duration: 0,
							isLoading: false,
							volume: state.audioPlayer.volume,
							isMinimized: state.audioPlayer.isMinimized,
							waveformReady: false,
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

			removeFilesByPath: (paths) =>
				set((state) => {
					const removedFilePaths = new Set(paths);

					const newFiles = state.files.filter(
						(f) => !removedFilePaths.has(f.filePath)
					);
					const newOriginalFiles = state.originalFiles.filter(
						(f) => !removedFilePaths.has(f.filePath)
					);

					const newAudioCache = new Map(state.audioDataCache);
					removedFilePaths.forEach((filePath) => {
						newAudioCache.delete(filePath);
					});

					const presentPaths = new Set(newFiles.map((f) => f.filePath));
					const newSelectedRows = state.selectedRows.filter((p) =>
						presentPaths.has(p)
					);

					const filteredFiles = filterFiles(
						newFiles,
						state.searchText,
						state.searchField
					);

					const currentFile = state.audioPlayer.currentFile;
					let newAudioPlayerState = state.audioPlayer;
					if (currentFile && removedFilePaths.has(currentFile.filePath)) {
						stopWaveSurfer();
						newAudioPlayerState = {
							currentFile: null,
							isPlaying: false,
							currentTime: 0,
							duration: 0,
							isLoading: false,
							volume: state.audioPlayer.volume,
							isMinimized: state.audioPlayer.isMinimized,
							waveformReady: false,
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
						filteredFiles: filterFiles(
							newFiles,
							state.searchText,
							state.searchField
						),
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
						filteredFiles: filterFiles(
							newFiles,
							state.searchText,
							state.searchField
						),
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
						filteredFiles: filterFiles(
							updatedFiles,
							state.searchText,
							state.searchField
						),
						isDirty: true,
					};
				}),

			selectFile: (filePath, multiSelect = false, _rangeSelect = false) =>
				set((state) => {
					// Range-select requires an ordered path list; callers use selectRange.
					const current = state.selectedRows;
					if (multiSelect) {
						const idx = current.indexOf(filePath);
						if (idx > -1) {
							const next = [...current];
							next.splice(idx, 1);
							return { selectedRows: next };
						}
						return { selectedRows: [...current, filePath] };
					}
					return { selectedRows: [filePath] };
				}),

			selectRange: (fromPath, toPath, orderedPaths) =>
				set(() => {
					const fromIdx = orderedPaths.indexOf(fromPath);
					const toIdx = orderedPaths.indexOf(toPath);
					if (fromIdx === -1 || toIdx === -1) {
						return { selectedRows: toIdx === -1 ? [] : [toPath] };
					}
					const start = Math.min(fromIdx, toIdx);
					const end = Math.max(fromIdx, toIdx);
					return { selectedRows: orderedPaths.slice(start, end + 1) };
				}),

			clearSelection: () => set({ selectedRows: [] }),

			setSelectedRows: (paths) =>
				set((state) => {
					const present = new Set(state.files.map((f) => f.filePath));
					return { selectedRows: paths.filter((p) => present.has(p)) };
				}),

			setLoadingProgress: (progress) => set({ loadingProgress: progress }),

			setAgentStatuses: (statuses) => set({ agentStatuses: statuses }),

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
						originalFiles: structuredClone(state.files),
						history: [],
						historyIndex: -1,
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
						file.filePath === filePath
							? { ...file, [field]: oldValue, lastModified: Date.now() }
							: file
					);

					return {
						files: newFiles,
						filteredFiles: filterFiles(
							newFiles,
							state.searchText,
							state.searchField
						),
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
						file.filePath === filePath
							? { ...file, [field]: newValue, lastModified: Date.now() }
							: file
					);

					return {
						files: newFiles,
						filteredFiles: filterFiles(
							newFiles,
							state.searchText,
							state.searchField
						),
						historyIndex: state.historyIndex + 1,
						isDirty: true,
					};
				}),

			loadAudioFile: async (file: Wavedata) => {
				const myId = ++loadAudioRequestId;

				set((state) => ({
					audioPlayer: {
						...state.audioPlayer,
						currentFile: file,
						isPlaying: true, // Auto-play by default
						currentTime: 0,
						duration: 0,
						waveformReady: false,
						isLoading: true,
					},
				}));

				try {
					let audioData = get().audioDataCache.get(file.filePath);
					if (!audioData) {
						audioData = await window.electronAPI.loadAudioFile(file.filePath);
					}

					// If a newer request has superseded us, bail out.
					if (myId !== loadAudioRequestId) return;

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
					if (myId !== loadAudioRequestId) return;
					console.error('Failed to load audio file:', error);
					set((state) => ({
						audioPlayer: {
							...state.audioPlayer,
							isLoading: false,
							isPlaying: false,
						},
						error: `Failed to load audio: ${
							error instanceof Error ? error.message : String(error)
						}`,
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
						},
					};
				}),

			stopAudio: () =>
				set((state) => ({
					audioPlayer: {
						...state.audioPlayer,
						isPlaying: false,
						currentTime: 0,
					},
				})),

			setCurrentTime: (time) =>
				set((state) => ({
					audioPlayer: { ...state.audioPlayer, currentTime: time },
				})),

			setVolume: (volume) =>
				set((state) => {
					const clamped = Math.min(1, Math.max(0, volume));
					savePersistedBlob(state.settings, clamped);
					return {
						audioPlayer: { ...state.audioPlayer, volume: clamped },
					};
				}),

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
				set((state) => ({
					audioPlayer: { ...state.audioPlayer, duration },
				})),

			// Audio Data Cache Actions (FIFO eviction at ~500MB)
			addAudioDataToCache: (filePath, data) =>
				set((state) => {
					const newCache = new Map(state.audioDataCache);
					newCache.set(filePath, data);

					const MAX_CACHE_BYTES = 500 * 1024 * 1024;
					let totalSize = 0;
					for (const [, buf] of newCache) totalSize += buf.byteLength;

					if (totalSize > MAX_CACHE_BYTES) {
						const currentlyPlaying = state.audioPlayer.currentFile?.filePath;
						const keys = Array.from(newCache.keys());
						for (const key of keys) {
							if (key === filePath || key === currentlyPlaying) continue;
							totalSize -= newCache.get(key)!.byteLength;
							newCache.delete(key);
							if (totalSize <= MAX_CACHE_BYTES) break;
						}
					}

					return { audioDataCache: newCache };
				}),

			// Settings Actions
			toggleDarkMode: () => {
				set((state) => {
					const newSettings = {
						...state.settings,
						isDarkMode: !state.settings.isDarkMode,
					};
					savePersistedBlob(newSettings, state.audioPlayer.volume);
					return { settings: newSettings };
				});
			},

			setFontSize: (size: string) => {
				set((state) => {
					const newSettings = { ...state.settings, fontSize: size };
					savePersistedBlob(newSettings, state.audioPlayer.volume);
					return { settings: newSettings };
				});
			},

			toggleTooltips: () => {
				set((state) => {
					const newSettings = {
						...state.settings,
						showTooltips: !state.settings.showTooltips,
					};
					savePersistedBlob(newSettings, state.audioPlayer.volume);
					return { settings: newSettings };
				});
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
		};
	},
	Object.is
);
