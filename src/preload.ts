import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI, CHANNELS } from './ipc-api';

export interface LoadingProgress {
	fileName: string;
	percentage: number;
	processed: number;
	total: number;
}

const createListener =
	(channel: string) => (callback: (...args: any[]) => void) => {
		const subscription = (event: Electron.IpcRendererEvent, ...args: any[]) =>
			callback(...args);
		ipcRenderer.on(channel, subscription);
		return () => {
			ipcRenderer.removeListener(channel, subscription);
		};
	};

const electronAPI: IElectronAPI = {
	openFileDialog: () => ipcRenderer.invoke(CHANNELS.openFile),
	showOpenDialog: () => ipcRenderer.invoke(CHANNELS.openDirectory),
	selectMirrorDestination: () =>
		ipcRenderer.invoke(CHANNELS.selectMirrorDestination),
	scanDirectory: (dirPath) =>
		ipcRenderer.invoke(CHANNELS.scanDirectory, dirPath),
	checkIsDirectory: (filePath) =>
		ipcRenderer.invoke(CHANNELS.checkIsDirectory, filePath),
	loadAudioFile: (filePath) =>
		ipcRenderer.invoke(CHANNELS.loadAudioFile, filePath),
	getPathForFile: (file: File) => (file as any).path || file.name,
	readMetadata: (filePath) =>
		ipcRenderer.invoke(CHANNELS.readMetadata, filePath),
	writeMetadata: (filePath, metadata) =>
		ipcRenderer.invoke(CHANNELS.writeMetadata, filePath, metadata),
	batchUpdateMetadata: (updates) =>
		ipcRenderer.invoke(CHANNELS.batchUpdateMetadata, updates),
	batchExtractMetadata: (filePaths) =>
		ipcRenderer.invoke(CHANNELS.batchExtractMetadata, filePaths),
	setCurrentFiles: (files) =>
		ipcRenderer.invoke(CHANNELS.setCurrentFiles, files),
	mirrorFiles: (config) => ipcRenderer.invoke(CHANNELS.mirrorFiles, config),
	checkFileConflicts: (config) =>
		ipcRenderer.invoke(CHANNELS.checkFileConflicts, config),
	startFileWatching: (filePath: string) =>
		ipcRenderer.invoke(CHANNELS.startFileWatching, filePath),
	stopFileWatching: () =>
		ipcRenderer.invoke(CHANNELS.stopFileWatching),
	getAgentStatuses: () => ipcRenderer.invoke(CHANNELS.getAgentStatuses),
	toggleAgent: (name, active) =>
		ipcRenderer.invoke(CHANNELS.toggleAgent, name, active),
	triggerAgent: (name) => ipcRenderer.invoke(CHANNELS.triggerAgent, name),
	onFileChanged: createListener(CHANNELS.onFileChanged),
	onProgressUpdate: createListener(CHANNELS.onProgressUpdate),
	onAgentStatusChange: createListener(CHANNELS.onAgentStatusChange),
	onAutoSaveRequest: createListener(CHANNELS.onAutoSaveRequest),
	removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
	createTestFiles: () => ipcRenderer.invoke(CHANNELS.createTestFiles),
	debugLog: (message: string, data?: any) =>
		ipcRenderer.invoke(CHANNELS.debugLog, message, data),
	windowMinimize: () => ipcRenderer.invoke(CHANNELS.windowMinimize),
	windowClose: () => ipcRenderer.invoke(CHANNELS.windowClose),
	windowToggleFullscreen: () =>
		ipcRenderer.invoke(CHANNELS.windowToggleFullscreen),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
	interface Window {
		electronAPI: IElectronAPI;
	}
}
