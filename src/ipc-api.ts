import {
	Wavedata,
	AgentStatus,
	MirrorConfiguration,
	MirrorResult,
} from './types';

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
	batchUpdateMetadata: 'ipc:batch-update-metadata',
	batchExtractMetadata: 'ipc:batch-extract-metadata',
	// Mirror Feature
	setCurrentFiles: 'ipc:set-current-files',
	mirrorFiles: 'ipc:mirror-files',
	checkFileConflicts: 'ipc:check-file-conflicts',
	// Agents & Status
	getAgentStatuses: 'ipc:agents-get-statuses',
	toggleAgent: 'ipc:agents-toggle',
	triggerAgent: 'ipc:agents-trigger',
	// Listeners (Main -> Renderer)
	onFileChanged: 'ipc:on-file-changed',
	onProgressUpdate: 'ipc:on-progress-update',
	onAgentStatusChange: 'ipc:on-agent-status-change',
	onAutoSaveRequest: 'ipc:on-auto-save-request',
	// Test Utilities
	createTestFiles: 'ipc:create-test-files',
	// Debug
	debugLog: 'ipc:debug-log',
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
	batchUpdateMetadata: (
		updates: { filePath: string; field: keyof Wavedata; value: any }[]
	) => Promise<void>;
	batchExtractMetadata: (filePaths: string[]) => Promise<Partial<Wavedata>[]>;
	// Mirror Feature
	setCurrentFiles: (files: Wavedata[]) => Promise<void>;
	mirrorFiles: (config: MirrorConfiguration) => Promise<MirrorResult>;
	checkFileConflicts: (config: MirrorConfiguration) => Promise<string[]>;
	// Agents & Status
	getAgentStatuses: () => Promise<AgentStatus[]>;
	toggleAgent: (name: string, active: boolean) => Promise<void>;
	triggerAgent: (name: string) => Promise<void>;
	// Listeners
	onFileChanged: (callback: (filePath: string) => void) => () => void;
	onProgressUpdate: (callback: (progress: any) => void) => () => void;
	onAgentStatusChange: (callback: (status: any) => void) => () => void;
	onAutoSaveRequest: (callback: (filePaths: string[]) => void) => () => void;
	removeAllListeners: (channel: string) => void;
	// Test Utilities
	createTestFiles: () => Promise<{ success: boolean; directory: string }>;
	// Debug
	debugLog: (message: string, data?: any) => Promise<void>;
}
