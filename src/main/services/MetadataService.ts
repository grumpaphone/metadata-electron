import { WaveFile } from 'wavefile';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Wavedata, BWFMetadata, FileInfo, IXMLMetadata } from '../../types';

export class MetadataService {
	private xmlParser = new XMLParser({ ignoreAttributes: false });
	private xmlBuilder = new XMLBuilder({});

	async readMetadata(filePath: string): Promise<Wavedata> {
		if (!fs.existsSync(filePath)) {
			throw new Error(`File not found: ${filePath}`);
		}

		const ext = path.extname(filePath).toLowerCase();
		if (ext !== '.wav') {
			throw new Error(`Unsupported file format: ${ext}`);
		}

		try {
			const buffer = fs.readFileSync(filePath);
			const wav = new WaveFile();
			wav.fromBuffer(buffer);

			const fileInfo = this.getFileInfo(filePath, wav);
			const bwf = this.extractBwfData(wav);
			const ixml = this.extractIXMLData(wav);
			const filenameData = this.parseFilename(fileInfo.fileName);

			// Hierarchical field extraction, prioritizing filename parse for structure
			const show =
				ixml?.BWFXML?.PROJECT || filenameData.show || bwf.Originator || '';
			let scene = ixml?.BWFXML?.SCENE || filenameData.scene || '';
			let take = ixml?.BWFXML?.TAKE || filenameData.take || '';
			const slate = ixml?.BWFXML?.SLATE || filenameData.slate || '';
			const category = ixml?.BWFXML?.CATEGORY || filenameData.category || '';
			const subcategory =
				ixml?.BWFXML?.SUBCATEGORY || filenameData.subcategory || '';
			const note = ixml?.BWFXML?.NOTE || bwf.Description || '';

			// Pattern matching for Scene/Take from BWF Description
			if ((!scene || !take) && bwf.Description) {
				const sceneTakeMatch = bwf.Description.match(
					/S(?:C|CNE)?[_\s]*(\S+?)[_\s]*T(?:K|AKE)?[_\s]*(\S+)/i
				);
				if (sceneTakeMatch) {
					scene = scene || sceneTakeMatch[1];
					take = take || sceneTakeMatch[2];
				}
			}

			return {
				filePath,
				filename: fileInfo.fileName,
				show,
				scene,
				take,
				slate,
				category,
				subcategory,
				ixmlNote: note,
				ixmlWildtrack: String(!!ixml?.BWFXML?.WILD_TRACK),
				ixmlCircled: String(!!ixml?.BWFXML?.CIRCLED),
				bwf,
				iXML: ixml,
				fileInfo,
				duration: fileInfo.duration,
				fileSize: fileInfo.fileSize,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Failed to read metadata for ${filePath}: ${message}`);
			throw new Error(`Failed to read metadata: ${message}`);
		}
	}

	async writeMetadata(filePath: string, metadata: Wavedata): Promise<void> {
		const backupPath = filePath + '.backup';
		fs.copyFileSync(filePath, backupPath);

		try {
			const buffer = fs.readFileSync(filePath);
			const wav = new WaveFile();
			wav.fromBuffer(buffer);

			this.updateBwfData(wav, metadata);
			this.updateIXMLData(wav, metadata);

			const outputBuffer = wav.toBuffer();
			fs.writeFileSync(filePath, outputBuffer);

			console.log(`Metadata written successfully: ${filePath}`);
		} catch (error) {
			fs.copyFileSync(backupPath, filePath); // Restore from backup
			throw error;
		}
	}

	private parseFilename(fileName: string): Partial<Wavedata> {
		// Regex for formats like: PR2_Allen_Sc5.14D_01.wav
		const pattern = /^([^_]+)_([^_]+)_Sc([\d.]+)([A-Z]?)_(\d+)\.wav$/i;
		const match = fileName.match(pattern);

		if (match) {
			const sceneNumber = match[3]; // e.g., "5.14"
			const slate = match[4] || ''; // e.g., "D"
			const episode = sceneNumber.split('.')[0];

			return {
				show: match[1], // e.g., "PR2"
				category: match[2], // e.g., "Allen"
				scene: sceneNumber, // e.g., "5.14"
				slate: slate, // e.g., "D"
				take: match[5], // e.g., "01"
				subcategory: episode, // e.g., "5"
			};
		}

		return {};
	}

	private getFileInfo(filePath: string, wav: WaveFile): FileInfo {
		const stats = fs.statSync(filePath);
		const fmt = wav.fmt as any;
		const data = wav.data as any;

		return {
			fileName: path.basename(filePath),
			fileSize: stats.size,
			lastModified: stats.mtime,
			sampleRate: fmt.sampleRate,
			bitDepth: wav.bitDepth,
			channels: fmt.numChannels,
			duration: data.samples
				? data.samples.length / (fmt.sampleRate * fmt.numChannels)
				: 0,
			format: fmt.audioFormat === 1 ? 'PCM' : 'Other',
		};
	}

	private extractBwfData(wav: WaveFile): Partial<BWFMetadata> {
		const bwfData: Partial<BWFMetadata> = {};
		try {
			const bext = (wav as any).bext;
			if (bext) {
				bwfData.Description = bext.description || '';
				bwfData.Originator = bext.originator || '';
				bwfData.OriginatorReference = bext.originatorReference || '';
				bwfData.OriginationDate = bext.originationDate || '';
				bwfData.OriginationTime = bext.originationTime || '';
				if (bext.timeReference && Array.isArray(bext.timeReference)) {
					bwfData.TimeReferenceLow = bext.timeReference[0] || 0;
					bwfData.TimeReferenceHigh = bext.timeReference[1] || 0;
				}
				bwfData.CodingHistory = bext.codingHistory || '';
			}
		} catch (error) {
			console.warn('Error extracting BWF data:', error);
		}
		return bwfData;
	}

	private extractIXMLData(wav: WaveFile): IXMLMetadata | null {
		try {
			// Correctly get the iXML chunk data using the library's method
			const ixmlString = wav.getiXML();
			if (ixmlString && typeof ixmlString === 'string') {
				return this.xmlParser.parse(ixmlString);
			}
		} catch (error) {
			console.warn('Error parsing iXML data:', error);
		}
		return null;
	}

	private updateBwfData(wav: WaveFile, metadata: Wavedata): void {
		if (!metadata.bwf) metadata.bwf = {};
		// Transfer top-level fields to BWF if they make sense
		metadata.bwf.Description = metadata.ixmlNote;
		metadata.bwf.Originator = metadata.show;

		wav.bext = metadata.bwf;
	}

	private updateIXMLData(wav: WaveFile, metadata: Wavedata): void {
		if (!metadata.iXML) metadata.iXML = { BWFXML: {} };
		if (!metadata.iXML.BWFXML) metadata.iXML.BWFXML = {};

		// Transfer top-level fields to iXML
		metadata.iXML.BWFXML.PROJECT = metadata.show;
		metadata.iXML.BWFXML.SCENE = metadata.scene;
		metadata.iXML.BWFXML.TAKE = metadata.take;
		metadata.iXML.BWFXML.SLATE = metadata.slate;
		metadata.iXML.BWFXML.NOTE = metadata.ixmlNote;
		metadata.iXML.BWFXML.CIRCLED = metadata.ixmlCircled === 'true';

		const xmlString = this.xmlBuilder.build(metadata.iXML);
		wav.setiXML(xmlString);
	}
}

export const metadataService = new MetadataService();
