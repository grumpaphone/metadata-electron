import { createWithEqualityFn } from 'zustand/traditional';
import {
	Wavedata,
	AgentStatus,
	UndoRedoCommand,
	MetadataEditCommand,
	BatchCommand,
} from '../types';

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
	selectedIndices: number[];
	loadingProgress: LoadingProgress | null;
	agentStatuses: AgentStatus[];
	activeFilePath: string | null;
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
	setActiveFile: (filePath: string | null) => void;
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

export const useStore = createWithEqualityFn<AppState>(
	(set, get) => ({
		files: [],
		originalFiles: [],
		audioDataCache: new Map(),
		selectedIndices: [],
		loadingProgress: null,
		agentStatuses: [],
		activeFilePath: null,
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
		columnVisibility: getDefaultColumnVisibility(),
		columnOrder: getDefaultColumnOrder(),
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
			console.log('[STORE] setSearch called with:', {
				searchText,
				searchField,
			});
			const state = get();
			const newSearchField = searchField || state.searchField;
			const lowercasedFilter = searchText.toLowerCase();

			console.log('[STORE] Search config:', {
				searchText,
				newSearchField,
				lowercasedFilter,
				currentSearchField: state.searchField,
			});
			console.log('[STORE] Total files to search:', state.files.length);

			const filteredFiles = state.files.filter((file) => {
				if (!lowercasedFilter) return true;

				// If searching all fields, check multiple fields
				if (newSearchField === 'all') {
					console.log('[STORE] Searching all fields for file:', file.filename);
					const searchableFields = [
						'filename',
						'show',
						'category',
						'subcategory',
						'scene',
						'take',
						'ixmlNote',
					];
					const result = searchableFields.some((field) => {
						const fieldValue = file[field as keyof Wavedata] as string;
						const fieldContainsSearch = String(fieldValue || '')
							.toLowerCase()
							.includes(lowercasedFilter);
						if (fieldContainsSearch) {
							console.log(
								`[STORE] Match found in field '${field}':`,
								fieldValue
							);
						}
						return fieldContainsSearch;
					});
					console.log('[STORE] All fields search result:', result);
					return result;
				}

				// Otherwise search specific field
				console.log(
					`[STORE] Searching specific field '${newSearchField}' for file:`,
					file.filename
				);
				const fieldValue = file[newSearchField as keyof Wavedata] as string;
				const result = String(fieldValue || '')
					.toLowerCase()
					.includes(lowercasedFilter);
				console.log(`[STORE] Field '${newSearchField}' value:`, fieldValue);
				console.log(`[STORE] Field search result:`, result);
				return result;
			});

			console.log(
				'[STORE] Filtered files result:',
				filteredFiles.length,
				'files'
			);
			console.log(
				'[STORE] First few matches:',
				filteredFiles.slice(0, 3).map((f) => f.filename)
			);

			set({
				searchText,
				searchField: newSearchField,
				filteredFiles,
			});
		},

		removeFiles: (indices) =>
			set((state) => {
				console.log('[STORE] removeFiles called with indices:', indices);
				console.log('[STORE] Current files length:', state.files.length);
				console.log(
					'[STORE] Files at indices:',
					indices.map((i) => state.files[i]?.filename || 'undefined')
				);

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
				const lowercasedFilter = state.searchText.toLowerCase();
				const filteredFiles = newFiles.filter((file) => {
					if (!lowercasedFilter) return true;

					if (state.searchField === 'all') {
						const searchableFields = [
							'filename',
							'show',
							'category',
							'subcategory',
							'scene',
							'take',
							'ixmlNote',
						];
						return searchableFields.some((field) => {
							const fieldValue = file[field as keyof Wavedata] as string;
							return String(fieldValue || '')
								.toLowerCase()
								.includes(lowercasedFilter);
						});
					}

					const fieldValue = file[
						state.searchField as keyof Wavedata
					] as string;
					return String(fieldValue || '')
						.toLowerCase()
						.includes(lowercasedFilter);
				});

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

				// Re-apply the current filter
				const lowercasedFilter = state.searchText.toLowerCase();
				const filteredFiles = newFiles.filter((file) => {
					if (!lowercasedFilter) return true;

					// If searching all fields, check multiple fields
					if (state.searchField === 'all') {
						const searchableFields = [
							'filename',
							'show',
							'category',
							'subcategory',
							'scene',
							'take',
							'ixmlNote',
						];
						return searchableFields.some((field) => {
							const fieldValue = file[field as keyof Wavedata] as string;
							return String(fieldValue || '')
								.toLowerCase()
								.includes(lowercasedFilter);
						});
					}

					// Otherwise search specific field
					const fieldValue = file[
						state.searchField as keyof Wavedata
					] as string;
					return String(fieldValue || '')
						.toLowerCase()
						.includes(lowercasedFilter);
				});

				return {
					files: newFiles,
					filteredFiles,
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
				return { files: newFiles, isDirty: true };
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

				const lowercasedFilter = state.searchText.toLowerCase();
				const filteredFiles = updatedFiles.filter((file) => {
					if (!lowercasedFilter) return true;

					// If searching all fields, check multiple fields
					if (state.searchField === 'all') {
						const searchableFields = [
							'filename',
							'show',
							'category',
							'subcategory',
							'scene',
							'take',
							'ixmlNote',
						];
						return searchableFields.some((field) => {
							const fieldValue = file[field as keyof Wavedata] as string;
							return String(fieldValue || '')
								.toLowerCase()
								.includes(lowercasedFilter);
						});
					}

					// Otherwise search specific field
					const fieldValue = file[
						state.searchField as keyof Wavedata
					] as string;
					return String(fieldValue || '')
						.toLowerCase()
						.includes(lowercasedFilter);
				});

				return {
					files: updatedFiles,
					filteredFiles,
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

		setActiveFile: (filePath: string | null) =>
			set({ activeFilePath: filePath }),

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
				if (state.historyIndex < 0) return {}; // Nothing to undo

				const command = state.history[state.historyIndex];
				const { filePath, field, oldValue } = command;

				const newFiles = state.files.map((file) =>
					file.filePath === filePath ? { ...file, [field]: oldValue } : file
				);

				// Re-apply the current filter
				const lowercasedFilter = state.searchText.toLowerCase();
				const filteredFiles = newFiles.filter((file) => {
					if (!lowercasedFilter) return true;
					const fieldValue = file[
						state.searchField as keyof Wavedata
					] as string;
					return String(fieldValue).toLowerCase().includes(lowercasedFilter);
				});

				return {
					files: newFiles,
					filteredFiles,
					historyIndex: state.historyIndex - 1,
					isDirty: true,
				};
			}),

		redo: () =>
			set((state) => {
				if (state.historyIndex >= state.history.length - 1) return {}; // Nothing to redo

				const command = state.history[state.historyIndex + 1];
				const { filePath, field, newValue } = command;

				const newFiles = state.files.map((file) =>
					file.filePath === filePath ? { ...file, [field]: newValue } : file
				);

				// Re-apply the current filter
				const lowercasedFilter = state.searchText.toLowerCase();
				const filteredFiles = newFiles.filter((file) => {
					if (!lowercasedFilter) return true;
					const fieldValue = file[
						state.searchField as keyof Wavedata
					] as string;
					return String(fieldValue).toLowerCase().includes(lowercasedFilter);
				});

				return {
					files: newFiles,
					filteredFiles,
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
					console.log(`[STORE] Audio not in cache, fetching: ${file.filePath}`);
					audioData = await window.electronAPI.loadAudioFile(file.filePath);
				} else {
					console.log(`[STORE] Audio loaded from cache: ${file.filePath}`);
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

		// Audio Data Cache Actions
		addAudioDataToCache: (filePath, data) =>
			set((state) => {
				const newCache = new Map(state.audioDataCache);
				newCache.set(filePath, data);
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
			set((state) => ({
				settings: loadSettingsFromStorage(),
			}));
		},

		saveSettings: () => {
			const { settings } = get();
			saveSettingsToStorage(settings);
		},

		// Column Visibility Actions
		toggleColumnVisibility: (column: keyof ColumnVisibilityState) => {
			set((state) => ({
				columnVisibility: {
					...state.columnVisibility,
					[column]: !state.columnVisibility[column],
				},
			}));
		},

		resetColumnVisibility: () => {
			set({
				columnVisibility: getDefaultColumnVisibility(),
			});
		},

		// Column Order Actions
		reorderColumns: (fromIndex: number, toIndex: number) => {
			console.log('[STORE] reorderColumns called:', { fromIndex, toIndex });
			set((state) => {
				console.log('[STORE] Current columnOrder:', state.columnOrder);
				const newOrder = [...state.columnOrder];
				const [movedColumn] = newOrder.splice(fromIndex, 1);
				newOrder.splice(toIndex, 0, movedColumn);
				console.log('[STORE] New columnOrder:', newOrder);
				return { columnOrder: newOrder };
			});
		},

		resetColumnOrder: () => {
			set({
				columnOrder: getDefaultColumnOrder(),
			});
		},
	}),
	Object.is
);
