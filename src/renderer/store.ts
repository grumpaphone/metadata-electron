import { create } from 'zustand';
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

	// Audio Player State
	audioPlayer: AudioPlayerState;

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
}

export const useStore = create<AppState>((set, get) => ({
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
	searchField: 'filename',
	filteredFiles: [],
	selectedRows: [],
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

	addFiles: (files) => {
		set((state) => ({
			files: [...state.files, ...files],
			originalFiles: [...state.originalFiles, ...files],
		}));
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
		const lowercasedFilter = searchText.toLowerCase();

		const filteredFiles = state.files.filter((file) => {
			if (!lowercasedFilter) return true;
			const fieldValue = file[newSearchField as keyof Wavedata] as string;
			return String(fieldValue).toLowerCase().includes(lowercasedFilter);
		});

		set({
			searchText,
			searchField: newSearchField,
			filteredFiles,
		});
	},

	removeFiles: (indices) =>
		set((state) => ({
			files: state.files.filter((_, i) => !indices.includes(i)),
		})),

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
				const fieldValue = file[state.searchField as keyof Wavedata] as string;
				return String(fieldValue).toLowerCase().includes(lowercasedFilter);
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
				const fieldValue = file[state.searchField as keyof Wavedata] as string;
				return String(fieldValue).toLowerCase().includes(lowercasedFilter);
			});

			return {
				files: updatedFiles,
				filteredFiles,
				isDirty: true,
			};
		}),

	selectFile: (index, ctrlKey, shiftKey) =>
		set((state) => {
			const currentSelection = [...state.selectedIndices];
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
				return { selectedIndices: selection };
			} else if (ctrlKey) {
				const indexInSelection = currentSelection.indexOf(index);
				if (indexInSelection > -1) {
					currentSelection.splice(indexInSelection, 1);
				} else {
					currentSelection.push(index);
				}
				return { selectedIndices: currentSelection };
			} else {
				return { selectedIndices: [index] };
			}
		}),

	setLoadingProgress: (progress) => set({ loadingProgress: progress }),

	setAgentStatuses: (statuses) => set({ agentStatuses: statuses }),

	getAgentStatus: (name: string) => {
		return get().agentStatuses.find((agent) => agent.name === name);
	},

	setActiveFile: (filePath: string | null) => set({ activeFilePath: filePath }),

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
				const fieldValue = file[state.searchField as keyof Wavedata] as string;
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
				const fieldValue = file[state.searchField as keyof Wavedata] as string;
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
}));
