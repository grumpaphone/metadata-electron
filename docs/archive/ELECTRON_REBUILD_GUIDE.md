# Audio Metadata Editor - Electron Rebuild Guide

This guide provides a complete blueprint for rebuilding the PyQt6 Audio Metadata Editor application in Electron with React/TypeScript, maintaining all functionality and architecture patterns.

## 📋 Project Overview

**Original:** PyQt6-based desktop app for WAV file metadata editing
**Target:** Electron + React + TypeScript with Node.js backend services
**Key Features:** Metadata editing, background agents, undo/redo, batch operations, file watching

## 🏗️ Project Structure

```
audio-metadata-editor/
├── src/
│   ├── main/                     # Main process (Node.js)
│   │   ├── index.ts             # Main Electron process
│   │   ├── services/            # Backend services
│   │   │   ├── MetadataService.ts
│   │   │   ├── FileService.ts
│   │   │   ├── BackgroundAgentManager.ts
│   │   │   └── agents/          # Background agents
│   │   │       ├── AutoSaveAgent.ts
│   │   │       ├── FileWatcherAgent.ts
│   │   │       └── ValidationAgent.ts
│   │   └── menu.ts              # Application menu
│   ├── renderer/                # Renderer process (React)
│   │   ├── App.tsx              # Main React component
│   │   ├── components/          # UI components
│   │   │   ├── MainWindow.tsx
│   │   │   ├── FileTable.tsx
│   │   │   ├── ToolBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── MirrorPanel.tsx
│   │   │   ├── SettingsDialog.tsx
│   │   │   └── FilenameExtractorDialog.tsx
│   │   ├── hooks/               # React hooks
│   │   │   ├── useStore.ts      # Zustand store
│   │   │   ├── useKeyboard.ts   # Keyboard shortcuts
│   │   │   └── useCommands.ts   # Command system
│   │   ├── services/            # Frontend services
│   │   │   ├── CommandManager.ts
│   │   │   └── FilenameParser.ts
│   │   └── types/               # TypeScript definitions
│   │       └── index.ts
│   ├── preload.ts              # Preload script for IPC
│   └── types.ts                # Shared types
├── package.json
├── webpack.main.config.js
├── webpack.renderer.config.js
└── tsconfig.json
```

## 🔧 Phase 1: Project Foundation

### 1.1 Initialize Electron Project

```bash
# Create project with TypeScript template
npx create-electron-app audio-metadata-editor --template=webpack-typescript

# Install React dependencies
npm install react react-dom
npm install -D @types/react @types/react-dom

# Install state management and utilities
npm install zustand
npm install -D @types/node

# Install audio processing libraries
npm install wavefile node-wav-metadata fluent-ffmpeg
npm install -D @types/fluent-ffmpeg
```

### 1.2 Configure Webpack

**webpack.renderer.config.js:**

```javascript
const rules = require('./webpack.rules');

module.exports = {
	target: 'electron-renderer',
	module: {
		rules: [
			...rules,
			{
				test: /\.tsx?$/,
				exclude: /(node_modules|\.webpack)/,
				use: {
					loader: 'ts-loader',
					options: {
						transpileOnly: true,
					},
				},
			},
		],
	},
	resolve: {
		extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
	},
};
```

### 1.3 TypeScript Configuration

**tsconfig.json:**

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"lib": ["ES2020", "DOM"],
		"module": "commonjs",
		"moduleResolution": "node",
		"jsx": "react-jsx",
		"allowJs": true,
		"outDir": "./dist/",
		"rootDir": "./src/",
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true
	},
	"include": ["src/**/*"],
	"exclude": ["node_modules", "dist"]
}
```

## 🔧 Phase 2: Type Definitions

### 2.1 Core Data Types

**src/types.ts:**

```typescript
export interface BwfData {
	description: string;
	originator: string;
	originatorReference: string;
	originationDate: string;
	originationTime: string;
	timeReference: [number, number];
	version: number;
	umid: string;
	loudnessValue: number;
	loudnessRange: number;
	maxTruePeakLevel: number;
	maxMomentaryLoudness: number;
	maxShortTermLoudness: number;
	codingHistory: string;
}

export interface IXMLData {
	project?: string;
	scene?: string;
	take?: string;
	file_family_name?: string;
	tape?: string;
	circled?: boolean;
	wild_track?: boolean;
	note?: string;
	[key: string]: any;
}

export interface Wavedata {
	filename: string;
	filePath: string;
	show: string;
	scene: string;
	take: string;
	category: string;
	subcategory: string;
	slate: string;
	ixmlNote: string;
	ixmlWildtrack: string;
	ixmlCircled: string;
	iXML?: IXMLData;
	bwf?: Partial<BwfData>;
}

export interface FileProcessingResult {
	filePath: string;
	metadata: Wavedata | null;
	error?: string;
}

export interface AgentStatus {
	name: string;
	active: boolean;
	lastRun?: Date;
	status: string;
	error?: string;
}
```

### 2.2 Command System Types

```typescript
export interface UndoRedoCommand {
	description: string;
	execute(): void;
	undo(): void;
}

export interface MetadataEditCommand extends UndoRedoCommand {
	fileIndex: number;
	field: keyof Wavedata;
	oldValue: any;
	newValue: any;
}

export interface BatchCommand extends UndoRedoCommand {
	commands: UndoRedoCommand[];
}
```

## 🔧 Phase 3: Metadata Processing Engine

### 3.1 Main Metadata Service

**src/main/services/MetadataService.ts:**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { WaveFile } from 'wavefile';
import { Wavedata, BwfData, IXMLData } from '../../types';

export class MetadataService {
	private cache = new Map<string, Wavedata>();

	async readMetadata(filePath: string): Promise<Wavedata> {
		if (this.cache.has(filePath)) {
			const cached = this.cache.get(filePath)!;
			// Check if file has been modified
			const stats = await fs.promises.stat(filePath);
			if (cached.lastModified === stats.mtime.getTime()) {
				return cached;
			}
		}

		try {
			const buffer = await fs.promises.readFile(filePath);
			const wav = new WaveFile(buffer);

			const metadata: Wavedata = {
				filename: path.basename(filePath),
				filePath: filePath,
				show: '',
				scene: '',
				take: '',
				category: '',
				subcategory: '',
				slate: '',
				ixmlNote: '',
				ixmlWildtrack: '',
				ixmlCircled: '',
				lastModified: (await fs.promises.stat(filePath)).mtime.getTime(),
			};

			// Extract BWF (Broadcast Wave Format) metadata
			const bextChunk = wav.getBext();
			if (bextChunk) {
				metadata.bwf = this.parseBwfData(bextChunk);
				this.extractFieldsFromBwf(metadata, metadata.bwf);
			}

			// Extract iXML metadata
			const ixmlChunk = wav.getiXML();
			if (ixmlChunk) {
				metadata.iXML = this.parseIXMLData(ixmlChunk);
				this.extractFieldsFromIXML(metadata, metadata.iXML);
			}

			// Extract from filename patterns
			this.extractFromFilename(metadata);

			this.cache.set(filePath, metadata);
			return metadata;
		} catch (error) {
			throw new Error(
				`Failed to read metadata from ${filePath}: ${error.message}`
			);
		}
	}

	async writeMetadata(filePath: string, metadata: Wavedata): Promise<void> {
		try {
			const buffer = await fs.promises.readFile(filePath);
			const wav = new WaveFile(buffer);

			// Build and set BWF chunk
			if (metadata.bwf) {
				wav.setBext(this.buildBwfChunk(metadata.bwf));
			}

			// Build and set iXML chunk
			if (metadata.iXML) {
				wav.setiXML(this.buildIXMLChunk(metadata.iXML));
			}

			// Create backup
			const backupPath = `${filePath}.backup`;
			await fs.promises.copyFile(filePath, backupPath);

			try {
				await fs.promises.writeFile(filePath, wav.toBuffer());
				// Remove backup on success
				await fs.promises.unlink(backupPath);

				// Update cache
				this.cache.set(filePath, metadata);
			} catch (writeError) {
				// Restore from backup on failure
				await fs.promises.copyFile(backupPath, filePath);
				await fs.promises.unlink(backupPath);
				throw writeError;
			}
		} catch (error) {
			throw new Error(
				`Failed to write metadata to ${filePath}: ${error.message}`
			);
		}
	}

	private parseBwfData(bextChunk: any): Partial<BwfData> {
		// Implementation for parsing BWF chunk data
		return {
			description: bextChunk.description || '',
			originator: bextChunk.originator || '',
			originatorReference: bextChunk.originatorReference || '',
			// ... other BWF fields
		};
	}

	private parseIXMLData(ixmlChunk: any): IXMLData {
		// Implementation for parsing iXML chunk data
		try {
			// Parse XML string to extract structured data
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(ixmlChunk, 'text/xml');

			return {
				project: this.getXMLValue(xmlDoc, 'PROJECT'),
				scene: this.getXMLValue(xmlDoc, 'SCENE'),
				take: this.getXMLValue(xmlDoc, 'TAKE'),
				// ... other iXML fields
			};
		} catch (error) {
			console.warn('Failed to parse iXML data:', error);
			return {};
		}
	}

	private extractFieldsFromBwf(
		metadata: Wavedata,
		bwf: Partial<BwfData>
	): void {
		// Extract scene/take from BWF description using regex patterns
		if (bwf.description) {
			const sceneMatch = bwf.description.match(/S(?:C|CNE)?[_\s]*(\d+)/i);
			const takeMatch = bwf.description.match(/T(?:K|AKE)?[_\s]*(\d+)/i);

			if (sceneMatch) metadata.scene = sceneMatch[1];
			if (takeMatch) metadata.take = takeMatch[1];
		}
	}

	private extractFieldsFromIXML(metadata: Wavedata, ixml: IXMLData): void {
		if (ixml.scene) metadata.scene = ixml.scene;
		if (ixml.take) metadata.take = ixml.take;
		if (ixml.project) metadata.show = ixml.project;
		if (ixml.note) metadata.ixmlNote = ixml.note;
		if (ixml.circled) metadata.ixmlCircled = ixml.circled ? 'Yes' : 'No';
		if (ixml.wild_track)
			metadata.ixmlWildtrack = ixml.wild_track ? 'Yes' : 'No';
	}

	private extractFromFilename(metadata: Wavedata): void {
		// Implement filename pattern matching from original FilenameParser
		const patterns = {
			project_scene_take: /^([^_]+)_S(\d+)T(\d+)/i,
			scene_take_only: /S(\d+)T(\d+)/i,
			// ... other patterns
		};

		for (const [patternName, regex] of Object.entries(patterns)) {
			const match = metadata.filename.match(regex);
			if (match) {
				this.applyFilenamePattern(metadata, patternName, match);
				break;
			}
		}
	}
}
```

### 3.2 File Service

**src/main/services/FileService.ts:**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { ipcMain } from 'electron';
import { MetadataService } from './MetadataService';
import { Wavedata, FileProcessingResult } from '../../types';

export class FileService {
	private metadataService = new MetadataService();

	async scanDirectory(dirPath: string, recursive = true): Promise<string[]> {
		const wavFiles: string[] = [];

		const scanDir = async (currentPath: string): Promise<void> => {
			const entries = await fs.promises.readdir(currentPath, {
				withFileTypes: true,
			});

			for (const entry of entries) {
				const fullPath = path.join(currentPath, entry.name);

				if (entry.isDirectory() && recursive) {
					await scanDir(fullPath);
				} else if (
					entry.isFile() &&
					path.extname(entry.name).toLowerCase() === '.wav'
				) {
					wavFiles.push(fullPath);
				}
			}
		};

		await scanDir(dirPath);
		return wavFiles;
	}

	async processFiles(
		filePaths: string[],
		onProgress?: (current: number, total: number, fileName: string) => void
	): Promise<FileProcessingResult[]> {
		const results: FileProcessingResult[] = [];

		for (let i = 0; i < filePaths.length; i++) {
			const filePath = filePaths[i];
			onProgress?.(i + 1, filePaths.length, path.basename(filePath));

			try {
				const metadata = await this.metadataService.readMetadata(filePath);
				results.push({ filePath, metadata });
			} catch (error) {
				results.push({
					filePath,
					metadata: null,
					error: error.message,
				});
			}
		}

		return results;
	}

	setupIPC(): void {
		ipcMain.handle('file:scanDirectory', async (_, dirPath: string) => {
			return this.scanDirectory(dirPath);
		});

		ipcMain.handle('file:processFiles', async (_, filePaths: string[]) => {
			return this.processFiles(filePaths);
		});

		ipcMain.handle('metadata:read', async (_, filePath: string) => {
			return this.metadataService.readMetadata(filePath);
		});

		ipcMain.handle(
			'metadata:write',
			async (_, filePath: string, metadata: Wavedata) => {
				return this.metadataService.writeMetadata(filePath, metadata);
			}
		);
	}
}
```

## 🔧 Phase 4: Background Agent System

### 4.1 Background Agent Manager

**src/main/services/BackgroundAgentManager.ts:**

```typescript
import { EventEmitter } from 'events';
import { AutoSaveAgent } from './agents/AutoSaveAgent';
import { FileWatcherAgent } from './agents/FileWatcherAgent';
import { ValidationAgent } from './agents/ValidationAgent';
import { AgentStatus } from '../../types';

export class BackgroundAgentManager extends EventEmitter {
	private agents: Map<string, any> = new Map();
	private isRunning = false;

	constructor(private metadataService: any) {
		super();
	}

	start(): void {
		if (this.isRunning) return;

		// Initialize agents
		this.agents.set('autoSave', new AutoSaveAgent(this.metadataService));
		this.agents.set('fileWatcher', new FileWatcherAgent());
		this.agents.set('validation', new ValidationAgent(this.metadataService));

		// Start all agents
		for (const [name, agent] of this.agents) {
			agent.on('statusChange', (status: string) => {
				this.emit('agentStatusChange', { name, status });
			});

			agent.on('error', (error: string) => {
				this.emit('agentError', { name, error });
			});

			agent.start();
		}

		this.isRunning = true;
		this.emit('managerStarted');
	}

	stop(): void {
		if (!this.isRunning) return;

		for (const agent of this.agents.values()) {
			agent.stop();
		}

		this.agents.clear();
		this.isRunning = false;
		this.emit('managerStopped');
	}

	getStatus(): AgentStatus[] {
		const statuses: AgentStatus[] = [];

		for (const [name, agent] of this.agents) {
			statuses.push({
				name,
				active: agent.isActive(),
				lastRun: agent.getLastRun(),
				status: agent.getStatus(),
				error: agent.getLastError(),
			});
		}

		return statuses;
	}
}
```

### 4.2 Auto Save Agent

**src/main/services/agents/AutoSaveAgent.ts:**

```typescript
import { EventEmitter } from 'events';

export class AutoSaveAgent extends EventEmitter {
	private interval: NodeJS.Timeout | null = null;
	private pendingChanges: Set<string> = new Set();
	private isActive = false;

	constructor(private metadataService: any, private intervalMs = 30000) {
		super();
	}

	start(): void {
		if (this.isActive) return;

		this.isActive = true;
		this.interval = setInterval(() => {
			this.performAutoSave();
		}, this.intervalMs);

		this.emit('statusChange', 'Auto-save agent started');
	}

	stop(): void {
		if (!this.isActive) return;

		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}

		this.isActive = false;
		this.emit('statusChange', 'Auto-save agent stopped');
	}

	addPendingChange(filePath: string): void {
		this.pendingChanges.add(filePath);
	}

	private async performAutoSave(): Promise<void> {
		if (this.pendingChanges.size === 0) return;

		try {
			const filesToSave = Array.from(this.pendingChanges);
			this.pendingChanges.clear();

			for (const filePath of filesToSave) {
				// Emit to main process to save file
				this.emit('saveRequest', filePath);
			}

			this.emit('statusChange', `Auto-saved ${filesToSave.length} files`);
		} catch (error) {
			this.emit('error', `Auto-save failed: ${error.message}`);
		}
	}

	isActive(): boolean {
		return this.isActive;
	}

	getLastRun(): Date | undefined {
		return new Date(); // Implementation would track actual last run
	}

	getStatus(): string {
		return this.isActive ? 'Running' : 'Stopped';
	}

	getLastError(): string | undefined {
		return undefined; // Implementation would track last error
	}
}
```

## 🔧 Phase 5: React Frontend

### 5.1 Main Application Store

**src/renderer/hooks/useStore.ts:**

```typescript
import { create } from 'zustand';
import { Wavedata } from '../../types';

interface AppState {
	// File management
	filePath: string | null;
	files: Wavedata[];
	filteredFiles: Wavedata[];
	selectedRows: number[];

	// UI state
	isLoading: boolean;
	isSaving: boolean;
	isDirty: boolean;
	error: string | null;
	searchText: string;
	searchField: keyof Wavedata;

	// Command system
	history: Wavedata[][];
	currentIndex: number;

	// Background agents
	agentStatuses: AgentStatus[];

	// Actions
	setFilePath: (path: string) => void;
	loadFiles: () => Promise<void>;
	setFiles: (files: Wavedata[]) => void;
	updateMetadata: (index: number, field: keyof Wavedata, value: any) => void;
	setSelectedRows: (rows: number[]) => void;
	setSearchText: (text: string) => void;
	setSearchField: (field: keyof Wavedata) => void;
	saveAllChanges: () => Promise<void>;
	undo: () => void;
	redo: () => void;
	filterFiles: () => void;
}

export const useStore = create<AppState>((set, get) => ({
	// Initial state
	filePath: null,
	files: [],
	filteredFiles: [],
	selectedRows: [],
	isLoading: false,
	isSaving: false,
	isDirty: false,
	error: null,
	searchText: '',
	searchField: 'filename',
	history: [],
	currentIndex: -1,
	agentStatuses: [],

	// Actions
	setFilePath: (path: string) => {
		set({ filePath: path, error: null });
		get().loadFiles();
	},

	loadFiles: async () => {
		const { filePath } = get();
		if (!filePath) return;

		set({ isLoading: true, error: null });

		try {
			const wavFiles = await window.electronAPI.scanDirectory(filePath);
			const results = await window.electronAPI.processFiles(wavFiles);

			const validFiles = results
				.filter((r) => r.metadata !== null)
				.map((r) => r.metadata!);

			set({
				files: validFiles,
				filteredFiles: validFiles,
				isLoading: false,
			});

			get().filterFiles();
		} catch (error) {
			set({
				error: error.message,
				isLoading: false,
			});
		}
	},

	updateMetadata: (index: number, field: keyof Wavedata, value: any) => {
		const { files, history, currentIndex } = get();
		const newFiles = [...files];
		const oldValue = newFiles[index][field];

		newFiles[index] = { ...newFiles[index], [field]: value };

		// Add to history for undo/redo
		const newHistory = history.slice(0, currentIndex + 1);
		newHistory.push([...newFiles]);

		set({
			files: newFiles,
			history: newHistory,
			currentIndex: newHistory.length - 1,
			isDirty: true,
		});

		get().filterFiles();
	},

	filterFiles: () => {
		const { files, searchText, searchField } = get();

		if (!searchText.trim()) {
			set({ filteredFiles: files });
			return;
		}

		const filtered = files.filter((file) => {
			const value = file[searchField];
			return String(value).toLowerCase().includes(searchText.toLowerCase());
		});

		set({ filteredFiles: filtered });
	},

	undo: () => {
		const { history, currentIndex } = get();
		if (currentIndex > 0) {
			const newIndex = currentIndex - 1;
			set({
				files: [...history[newIndex]],
				currentIndex: newIndex,
				isDirty: true,
			});
			get().filterFiles();
		}
	},

	redo: () => {
		const { history, currentIndex } = get();
		if (currentIndex < history.length - 1) {
			const newIndex = currentIndex + 1;
			set({
				files: [...history[newIndex]],
				currentIndex: newIndex,
				isDirty: true,
			});
			get().filterFiles();
		}
	},

	// ... other actions
}));
```

### 5.2 Main Window Component

**src/renderer/components/MainWindow.tsx:**

```typescript
import React, { useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { ToolBar } from './ToolBar';
import { FileTable } from './FileTable';
import { StatusBar } from './StatusBar';
import { MirrorPanel } from './MirrorPanel';

export const MainWindow: React.FC = () => {
	const { isLoading, error, agentStatuses, filePath } = useStore();

	// Setup keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey) {
				switch (e.key) {
					case 'z':
						if (e.shiftKey) {
							useStore.getState().redo();
						} else {
							useStore.getState().undo();
						}
						e.preventDefault();
						break;
					case 's':
						useStore.getState().saveAllChanges();
						e.preventDefault();
						break;
					case 'o':
						// Open folder dialog
						window.electronAPI.showOpenDialog().then((result) => {
							if (!result.canceled && result.filePaths.length > 0) {
								useStore.getState().setFilePath(result.filePaths[0]);
							}
						});
						e.preventDefault();
						break;
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<div className='main-window'>
			<ToolBar />

			<div className='content-area'>
				{error && <div className='error-banner'>{error}</div>}

				{isLoading ? (
					<div className='loading-indicator'>Loading files...</div>
				) : (
					<FileTable />
				)}
			</div>

			<StatusBar agentStatuses={agentStatuses} />
			<MirrorPanel />
		</div>
	);
};
```

### 5.3 File Table Component

**src/renderer/components/FileTable.tsx:**

```typescript
import React, { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Wavedata } from '../../types';

export const FileTable: React.FC = () => {
	const { filteredFiles, selectedRows, updateMetadata, setSelectedRows } =
		useStore();

	const [sortColumn, setSortColumn] = useState<keyof Wavedata>('filename');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [editingCell, setEditingCell] = useState<{
		row: number;
		col: keyof Wavedata;
	} | null>(null);

	const columns: Array<{ key: keyof Wavedata; label: string; width: number }> =
		[
			{ key: 'filename', label: 'Filename', width: 200 },
			{ key: 'show', label: 'Show', width: 100 },
			{ key: 'scene', label: 'Scene', width: 80 },
			{ key: 'take', label: 'Take', width: 80 },
			{ key: 'category', label: 'Category', width: 120 },
			{ key: 'subcategory', label: 'Subcategory', width: 120 },
			{ key: 'slate', label: 'Slate', width: 100 },
			{ key: 'ixmlNote', label: 'Note', width: 150 },
			{ key: 'ixmlCircled', label: 'Circled', width: 80 },
			{ key: 'ixmlWildtrack', label: 'Wildtrack', width: 80 },
		];

	const sortedFiles = useMemo(() => {
		const sorted = [...filteredFiles].sort((a, b) => {
			const aVal = String(a[sortColumn] || '');
			const bVal = String(b[sortColumn] || '');

			if (sortDirection === 'asc') {
				return aVal.localeCompare(bVal);
			} else {
				return bVal.localeCompare(aVal);
			}
		});

		return sorted;
	}, [filteredFiles, sortColumn, sortDirection]);

	const handleSort = (column: keyof Wavedata) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortColumn(column);
			setSortDirection('asc');
		}
	};

	const handleCellEdit = (
		rowIndex: number,
		column: keyof Wavedata,
		value: string
	) => {
		const fileIndex = filteredFiles.indexOf(sortedFiles[rowIndex]);
		updateMetadata(fileIndex, column, value);
		setEditingCell(null);
	};

	const handleRowSelect = (rowIndex: number, isCtrlClick: boolean) => {
		if (isCtrlClick) {
			const newSelection = selectedRows.includes(rowIndex)
				? selectedRows.filter((r) => r !== rowIndex)
				: [...selectedRows, rowIndex];
			setSelectedRows(newSelection);
		} else {
			setSelectedRows([rowIndex]);
		}
	};

	return (
		<div className='file-table-container'>
			<table className='file-table'>
				<thead>
					<tr>
						{columns.map((column) => (
							<th
								key={column.key}
								style={{ width: column.width }}
								onClick={() => handleSort(column.key)}
								className={
									sortColumn === column.key ? `sorted-${sortDirection}` : ''
								}>
								{column.label}
								{sortColumn === column.key && (
									<span className='sort-indicator'>
										{sortDirection === 'asc' ? '↑' : '↓'}
									</span>
								)}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{sortedFiles.map((file, rowIndex) => (
						<tr
							key={file.filePath}
							className={selectedRows.includes(rowIndex) ? 'selected' : ''}
							onClick={(e) =>
								handleRowSelect(rowIndex, e.ctrlKey || e.metaKey)
							}>
							{columns.map((column) => (
								<td
									key={column.key}
									onDoubleClick={() =>
										setEditingCell({ row: rowIndex, col: column.key })
									}>
									{editingCell?.row === rowIndex &&
									editingCell?.col === column.key ? (
										<input
											type='text'
											defaultValue={String(file[column.key] || '')}
											onBlur={(e) =>
												handleCellEdit(rowIndex, column.key, e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													handleCellEdit(
														rowIndex,
														column.key,
														e.currentTarget.value
													);
												} else if (e.key === 'Escape') {
													setEditingCell(null);
												}
											}}
											autoFocus
										/>
									) : (
										String(file[column.key] || '')
									)}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
```

## 🔧 Phase 6: IPC Bridge & Main Process

### 6.1 Preload Script

**src/preload.ts:**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
	// File operations
	scanDirectory: (dirPath: string) =>
		ipcRenderer.invoke('file:scanDirectory', dirPath),

	processFiles: (filePaths: string[]) =>
		ipcRenderer.invoke('file:processFiles', filePaths),

	showOpenDialog: () => ipcRenderer.invoke('dialog:showOpenDialog'),

	// Metadata operations
	readMetadata: (filePath: string) =>
		ipcRenderer.invoke('metadata:read', filePath),

	writeMetadata: (filePath: string, metadata: any) =>
		ipcRenderer.invoke('metadata:write', filePath, metadata),

	// Background agents
	getAgentStatus: () => ipcRenderer.invoke('agents:getStatus'),

	onAgentStatusChange: (callback: Function) =>
		ipcRenderer.on('agents:statusChange', callback),

	// Application lifecycle
	onAppClose: (callback: Function) => ipcRenderer.on('app:close', callback),

	// File watching
	onFileChanged: (callback: Function) =>
		ipcRenderer.on('file:changed', callback),
});
```

### 6.2 Main Process Setup

**src/main/index.ts:**

```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { FileService } from './services/FileService';
import { BackgroundAgentManager } from './services/BackgroundAgentManager';
import { MetadataService } from './services/MetadataService';

let mainWindow: BrowserWindow;
let fileService: FileService;
let agentManager: BackgroundAgentManager;

const createWindow = (): void => {
	mainWindow = new BrowserWindow({
		height: 800,
		width: 1200,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, '../preload.js'),
		},
		titleBarStyle: 'hiddenInset', // macOS style
		vibrancy: 'window', // macOS transparency effect
	});

	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
	} else {
		mainWindow.loadFile(
			path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
		);
	}

	// Open DevTools in development
	if (process.env.NODE_ENV === 'development') {
		mainWindow.webContents.openDevTools();
	}
};

app.on('ready', () => {
	createWindow();

	// Initialize services
	const metadataService = new MetadataService();
	fileService = new FileService();
	agentManager = new BackgroundAgentManager(metadataService);

	// Setup IPC handlers
	fileService.setupIPC();
	setupApplicationIPC();

	// Start background agents
	agentManager.start();

	// Agent status updates
	agentManager.on('agentStatusChange', (status) => {
		mainWindow.webContents.send('agents:statusChange', status);
	});
});

app.on('window-all-closed', () => {
	// Stop background agents
	agentManager?.stop();

	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

const setupApplicationIPC = () => {
	ipcMain.handle('dialog:showOpenDialog', async () => {
		return await dialog.showOpenDialog(mainWindow, {
			properties: ['openDirectory'],
			title: 'Select WAV Files Directory',
		});
	});

	ipcMain.handle('agents:getStatus', async () => {
		return agentManager.getStatus();
	});
};
```

## 🔧 Phase 7: Testing & Deployment

### 7.1 Testing Strategy

**Testing Requirements:**

1. **Unit Tests**: Test metadata parsing, command system, file operations
2. **Integration Tests**: Test IPC communication, background agents
3. **E2E Tests**: Test complete workflows with actual WAV files
4. **Performance Tests**: Test with large datasets (1000+ files)

### 7.2 Sample Test Files

Create test suite with sample WAV files containing various metadata formats:

- BWF metadata samples
- iXML metadata samples
- Mixed format samples
- Corrupted/malformed samples

### 7.3 Package Configuration

**package.json additions:**

```json
{
	"main": ".webpack/main",
	"scripts": {
		"test": "jest",
		"test:e2e": "playwright test",
		"build": "electron-forge make",
		"package": "electron-forge package"
	},
	"config": {
		"forge": {
			"packagerConfig": {
				"name": "Audio Metadata Editor",
				"executableName": "audio-metadata-editor",
				"icon": "./assets/icon"
			},
			"makers": [
				{
					"name": "@electron-forge/maker-squirrel",
					"config": {
						"name": "audio_metadata_editor"
					}
				},
				{
					"name": "@electron-forge/maker-zip",
					"platforms": ["darwin", "linux"]
				},
				{
					"name": "@electron-forge/maker-deb",
					"config": {}
				}
			]
		}
	}
}
```

## 📝 Implementation Notes

### Critical Success Factors:

1. **Maintain exact functionality parity** with original PyQt6 app
2. **Preserve all background agent behaviors** (auto-save, file watching, validation)
3. **Implement robust undo/redo system** matching original command pattern
4. **Ensure metadata parsing accuracy** for all WAV format variants
5. **Maintain performance** with large file sets (1000+ files)

### Architecture Decisions:

- **Zustand** for state management (simpler than Redux)
- **Native IPC** instead of additional libraries for maximum performance
- **Separate service layer** in main process for business logic
- **React hooks** for UI logic encapsulation
- **TypeScript throughout** for type safety

### Migration Checklist:

- [ ] Phase 1: Project foundation and tooling
- [ ] Phase 2: Core type definitions
- [ ] Phase 3: Metadata processing engine
- [ ] Phase 4: Background agent system
- [ ] Phase 5: React frontend components
- [ ] Phase 6: IPC bridge implementation
- [ ] Phase 7: Testing and deployment setup

This guide provides the complete blueprint for rebuilding the PyQt6 Audio Metadata Editor in Electron while preserving all functionality and architectural patterns.
