export interface ElectronAPI {
	showOpenDialog(): Promise<string | null>;
	readMetadata(filePath: string): Promise<any>;
	saveMetadataAuto(filePath: string, metadata: any): Promise<void>;
	startWatching(filePath: string): void;
	onFileChanged(callback: (path: string) => void): () => void;
	onAutoSaveRequest(callback: () => void): () => void;
	onMetadataSaved(callback: () => void): () => void;
}

declare global {
	interface Window {
		electronAPI: ElectronAPI;
	}
}

export {};
