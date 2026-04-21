import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IElectronAPI, CHANNELS } from './ipc-api';
import type { LoadingProgress, AgentStatus } from './types';

const createListener =
	<T extends unknown[]>(channel: string) =>
	(callback: (...args: T) => void) => {
		const subscription = (
			_event: Electron.IpcRendererEvent,
			...args: T
		) => callback(...args);
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
	getPathForFile: (file: File) => webUtils.getPathForFile(file),
	readMetadata: (filePath) =>
		ipcRenderer.invoke(CHANNELS.readMetadata, filePath),
	writeMetadata: (filePath, metadata) =>
		ipcRenderer.invoke(CHANNELS.writeMetadata, filePath, metadata),
	mirrorFiles: (config, files) =>
		ipcRenderer.invoke(CHANNELS.mirrorFiles, config, files),
	checkFileConflicts: (config, files) =>
		ipcRenderer.invoke(CHANNELS.checkFileConflicts, config, files),
	startFileWatching: (filePath: string) =>
		ipcRenderer.invoke(CHANNELS.startFileWatching, filePath),
	stopFileWatching: () =>
		ipcRenderer.invoke(CHANNELS.stopFileWatching),
	getAgentStatuses: () => ipcRenderer.invoke(CHANNELS.getAgentStatuses),
	toggleAgent: (name, active) =>
		ipcRenderer.invoke(CHANNELS.toggleAgent, name, active),
	onFileChanged: createListener<[string]>(CHANNELS.onFileChanged),
	onProgressUpdate: createListener<[LoadingProgress]>(CHANNELS.onProgressUpdate),
	onAgentStatusChange: createListener<[AgentStatus[]]>(CHANNELS.onAgentStatusChange),
	debugLog: (message: string, data?: unknown) => {
		// Fire-and-forget; main uses ipcMain.handle so we invoke but discard the promise.
		void ipcRenderer.invoke(CHANNELS.debugLog, message, data);
	},
	windowMinimize: () => ipcRenderer.invoke(CHANNELS.windowMinimize),
	windowClose: () => ipcRenderer.invoke(CHANNELS.windowClose),
	windowToggleFullscreen: () =>
		ipcRenderer.invoke(CHANNELS.windowToggleFullscreen),
};

if (process.env.NODE_ENV !== 'production') {
	electronAPI.createTestFiles = () =>
		ipcRenderer.invoke(CHANNELS.createTestFiles);
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
	interface Window {
		electronAPI: IElectronAPI;
	}
}
