export interface BWFMetadata {
	Description?: string;
	Originator?: string;
	OriginatorReference?: string;
	OriginationDate?: string;
	OriginationTime?: string;
	TimeReferenceLow?: number;
	TimeReferenceHigh?: number;
	Version?: number;
	UMID?: string;
	LoudnessValue?: number;
	LoudnessRange?: number;
	MaxTruePeakLevel?: number;
	MaxMomentaryLoudness?: number;
	MaxShortTermLoudness?: number;
	CodingHistory?: string;
}

export interface IXMLMetadata {
	BWFXML?: {
		PROJECT?: string;
		SCENE?: string;
		TAKE?: string;
		SLATE?: string;
		CATEGORY?: string;
		SUBCATEGORY?: string;
		NOTE?: string;
		CIRCLED?: boolean | string;
		WILD_TRACK?: boolean | string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export interface FileInfo {
	fileName: string;
	fileSize: number;
	lastModified: Date;
	sampleRate: number;
	bitDepth: string;
	channels: number;
	duration: number;
	format: string;
}

// Main data structure matching the PyQt6 app fields
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
	iXML?: IXMLMetadata;
	bwf?: Partial<BWFMetadata>;
	fileInfo?: FileInfo;
	lastModified?: number;
	duration: number;
	fileSize: number;
}

// File processing results for batch operations
export interface FileProcessingResult {
	filePath: string;
	metadata: Wavedata | null;
	error?: string;
}

// Background agent status
export interface AgentStatus {
	name: string;
	active: boolean;
	/** ISO 8601 datetime */
	lastRun?: string;
	status: string;
	error?: string;
}

// Progress updates emitted from main to renderer during long-running operations
export interface LoadingProgress {
	current: number;
	total: number;
	message: string;
}

// Command system for undo/redo
export interface UndoRedoCommand {
	description?: string;
	execute?(): void;
	undo?(): void;
}

export interface MetadataEditCommand<K extends keyof Wavedata = keyof Wavedata>
	extends UndoRedoCommand {
	filePath: string;
	field: K;
	oldValue: Wavedata[K];
	newValue: Wavedata[K];
}

// Mirror feature types
export type MirrorOrganizeField =
	| 'show'
	| 'scene'
	| 'category'
	| 'subcategory'
	| 'take';

export interface MirrorOrganizeLevel {
	field: MirrorOrganizeField;
	order: number;
}

export interface MirrorConfiguration {
	destinationPath: string;
	organizeLevels: MirrorOrganizeLevel[];
	selectedFiles?: string[]; // If undefined, mirror all files
}

export interface MirrorResult {
	success: boolean;
	copiedFiles: number;
	errors: Array<{
		filePath: string;
		error: string;
	}>;
	conflicts: Array<{
		sourcePath: string;
		destinationPath: string;
		action: 'skip' | 'overwrite' | 'rename';
	}>;
}
