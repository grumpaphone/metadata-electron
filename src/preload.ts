// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';
import { Wavedata } from './types';
import { IElectronAPI, CHANNELS } from './ipc-api';

console.log('🔧 PRELOAD: Script starting...');
console.log('🔧 PRELOAD: Electron version:', process.versions.electron);
console.log('🔧 PRELOAD: Node version:', process.versions.node);
console.log('🔧 PRELOAD: Chrome version:', process.versions.chrome);
console.log('🔧 PRELOAD: Context isolation enabled:', process.contextIsolated);

// Simple test to see if the script even loads
console.log('🔧 PRELOAD: About to check ipcRenderer...');
console.log('🔧 PRELOAD: ipcRenderer available:', !!ipcRenderer);
console.log('🔧 PRELOAD: contextBridge available:', !!contextBridge);

export interface LoadingProgress {
	fileName: string;
	percentage: number;
	processed: number;
	total: number;
}

/**
 * A helper function to create a listener that can be cleaned up.
 * This prevents memory leaks and ensures clean state management.
 * @param channel The IPC channel to listen on.
 * @returns A function that takes a callback and returns an unsubscribe function.
 */
const createListener =
	(channel: string) => (callback: (...args: any[]) => void) => {
		const subscription = (event: Electron.IpcRendererEvent, ...args: any[]) =>
			callback(...args);
		ipcRenderer.on(channel, subscription);

		return () => {
			ipcRenderer.removeListener(channel, subscription);
		};
	};

/**
 * The type-safe API object that will be exposed to the renderer process.
 * It strictly implements the IElectronAPI interface.
 */
const electronAPI: IElectronAPI = {
	// Dialogs
	openFileDialog: () => ipcRenderer.invoke(CHANNELS.openFile),
	showOpenDialog: () => ipcRenderer.invoke(CHANNELS.openDirectory),
	selectMirrorDestination: () =>
		ipcRenderer.invoke(CHANNELS.selectMirrorDestination),
	// File System
	scanDirectory: (dirPath) =>
		ipcRenderer.invoke(CHANNELS.scanDirectory, dirPath),
	checkIsDirectory: (filePath) =>
		ipcRenderer.invoke(CHANNELS.checkIsDirectory, filePath),
	loadAudioFile: (filePath) =>
		ipcRenderer.invoke(CHANNELS.loadAudioFile, filePath),
	getPathForFile: (file: File) => (file as any).path || file.name,
	// Metadata
	readMetadata: (filePath) =>
		ipcRenderer.invoke(CHANNELS.readMetadata, filePath),
	writeMetadata: (filePath, metadata) =>
		ipcRenderer.invoke(CHANNELS.writeMetadata, filePath, metadata),
	batchUpdateMetadata: (updates) =>
		ipcRenderer.invoke(CHANNELS.batchUpdateMetadata, updates),
	batchExtractMetadata: (filePaths) =>
		ipcRenderer.invoke(CHANNELS.batchExtractMetadata, filePaths),
	// Mirror Feature
	setCurrentFiles: (files) =>
		ipcRenderer.invoke(CHANNELS.setCurrentFiles, files),
	mirrorFiles: (config) => ipcRenderer.invoke(CHANNELS.mirrorFiles, config),
	checkFileConflicts: (config) =>
		ipcRenderer.invoke(CHANNELS.checkFileConflicts, config),
	// Agents & Status
	getAgentStatuses: () => ipcRenderer.invoke(CHANNELS.getAgentStatuses),
	toggleAgent: (name, active) =>
		ipcRenderer.invoke(CHANNELS.toggleAgent, name, active),
	triggerAgent: (name) => ipcRenderer.invoke(CHANNELS.triggerAgent, name),
	// Listeners
	onFileChanged: createListener(CHANNELS.onFileChanged),
	onProgressUpdate: createListener(CHANNELS.onProgressUpdate),
	onAgentStatusChange: createListener(CHANNELS.onAgentStatusChange),
	onAutoSaveRequest: createListener(CHANNELS.onAutoSaveRequest),
	removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
	// Test Utilities
	createTestFiles: () => ipcRenderer.invoke(CHANNELS.createTestFiles),
	// Debug helper
	debugLog: (message: string, data?: any) =>
		ipcRenderer.invoke(CHANNELS.debugLog, message, data),
};

// Expose the API to the renderer process under the `electronAPI` key.
console.log('🔧 PRELOAD: About to expose electronAPI...');
console.log('🔧 PRELOAD: electronAPI object keys:', Object.keys(electronAPI));

// First, try the standard way
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
console.log('🔧 PRELOAD: API exposed via contextBridge');

// Add a simple test function
contextBridge.exposeInMainWorld('electronTest', {
	ping: () => 'pong',
	log: (message: string) => console.log('[PRELOAD-TEST]', message),
});

console.log('🔧 PRELOAD: Test API also exposed');

/**
 * TypeScript declaration for the window object in the renderer process.
 * This ensures that `window.electronAPI` is correctly typed.
 */
declare global {
	interface Window {
		electronAPI: IElectronAPI;
	}
}
