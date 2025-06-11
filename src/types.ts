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
	lastRun?: Date;
	status: string;
	error?: string;
}

// Command system for undo/redo
export interface UndoRedoCommand {
	description?: string;
	execute?(): void;
	undo?(): void;
}

export interface MetadataEditCommand extends UndoRedoCommand {
	filePath: string;
	field: keyof Wavedata;
	oldValue: any;
	newValue: any;
}

export interface BatchCommand extends UndoRedoCommand {
	commands: UndoRedoCommand[];
}

// Metadata analysis results for batch processing
export interface MetadataAnalysis {
	totalFiles: number;
	processedFiles: number;
	failedFiles: number;
	fieldCoverage: Record<string, number>; // Field name to percentage coverage
	shows: Set<string>;
	scenes: Set<string>;
	takes: Set<string>;
	categories: Set<string>;
	hasIXML: number;
	hasBWF: number;
	averageFileSize: number;
	duplicateDetection: Array<{
		sceneTake: string;
		files: string[];
	}>;
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
