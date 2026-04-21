import {
	Wavedata,
	AgentStatus,
	MirrorConfiguration,
	MirrorResult,
	LoadingProgress,
} from './types';

/**
 * Extended mirror result with a `cancelled` flag emitted when the
 * operation was aborted via `cancelMirror` before completing.
 */
export type MirrorResultWithCancel = MirrorResult & { cancelled?: boolean };

/**
 * A centralized object to hold all IPC channel names.
 * This provides a single source of truth and prevents typo-related errors.
 */
export const CHANNELS = {
	// Dialogs
	openFile: 'ipc:open-file-dialog',
	openDirectory: 'ipc:open-directory-dialog',
	selectMirrorDestination: 'ipc:select-mirror-destination',
	// File System
	scanDirectory: 'ipc:scan-directory',
	checkIsDirectory: 'ipc:is-directory',
	loadAudioFile: 'ipc:load-audio-file',
	// Metadata
	readMetadata: 'ipc:read-metadata',
	writeMetadata: 'ipc:write-metadata',
	// Mirror Feature
	mirrorFiles: 'ipc:mirror-files',
	cancelMirror: 'ipc:cancel-mirror',
	checkFileConflicts: 'ipc:check-file-conflicts',
	// Agents & Status
	getAgentStatuses: 'ipc:agents-get-statuses',
	toggleAgent: 'ipc:agents-toggle',
	// File Watching
	startFileWatching: 'ipc:start-file-watching',
	stopFileWatching: 'ipc:stop-file-watching',
	// Listeners (Main -> Renderer)
	onFileChanged: 'ipc:on-file-changed',
	onProgressUpdate: 'ipc:on-progress-update',
	onAgentStatusChange: 'ipc:on-agent-status-change',
	// Test Utilities
	createTestFiles: 'ipc:create-test-files',
	// Debug
	debugLog: 'ipc:debug-log',
	// Window Controls
	windowMinimize: 'ipc:window-minimize',
	windowClose: 'ipc:window-close',
	windowToggleFullscreen: 'ipc:window-toggle-fullscreen',
};

/**
 * The interface defining the API exposed from the preload script to the renderer.
 * This will be used to type `window.electronAPI` for type-safe access in the UI.
 */
export interface IElectronAPI {
	// Dialogs
	openFileDialog: () => Promise<string | null>;
	showOpenDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
	selectMirrorDestination: () => Promise<string | null>;
	// File System
	scanDirectory: (dirPath: string) => Promise<Wavedata[]>;
	checkIsDirectory: (filePath: string) => Promise<boolean>;
	loadAudioFile: (filePath: string) => Promise<ArrayBuffer>;
	// A utility that doesn't need IPC, handled in preload
	getPathForFile: (file: File) => string;
	// Metadata
	readMetadata: (filePath: string) => Promise<Wavedata>;
	writeMetadata: (filePath: string, metadata: Wavedata) => Promise<void>;
	// Mirror Feature
	mirrorFiles: (
		config: MirrorConfiguration,
		files: Wavedata[],
		opId: string
	) => Promise<MirrorResultWithCancel>;
	cancelMirror: (opId: string) => Promise<void>;
	checkFileConflicts: (
		config: MirrorConfiguration,
		files: Wavedata[]
	) => Promise<string[]>;
	// Agents & Status
	getAgentStatuses: () => Promise<AgentStatus[]>;
	toggleAgent: (name: string, active: boolean) => Promise<void>;
	// File Watching
	startFileWatching: (filePath: string) => Promise<void>;
	stopFileWatching: () => Promise<void>;
	// Listeners
	onFileChanged: (callback: (filePath: string) => void) => () => void;
	onProgressUpdate: (
		callback: (progress: LoadingProgress) => void
	) => () => void;
	onAgentStatusChange: (
		callback: (statuses: AgentStatus[]) => void
	) => () => void;
	// Test Utilities
	createTestFiles?: () => Promise<{
		success: boolean;
		directory: string;
		files?: string[];
		errors?: Array<{ filePath: string; error: string }>;
	}>;
	// Debug
	debugLog: (message: string, data?: unknown) => void;
	// Window Controls
	windowMinimize: () => Promise<void>;
	windowClose: () => Promise<void>;
	windowToggleFullscreen: () => Promise<void>;
}
