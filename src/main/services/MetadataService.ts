import { WaveFile } from 'wavefile';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Wavedata, BWFMetadata, FileInfo, IXMLMetadata } from '../../types';

export class MetadataService {
	private xmlParser = new XMLParser({ ignoreAttributes: false });
	private xmlBuilder = new XMLBuilder({});

	async readMetadata(filePath: string): Promise<Wavedata> {
		try {
			await fs.promises.access(filePath);
		} catch {
			throw new Error(`File not found: ${filePath}`);
		}

		const ext = path.extname(filePath).toLowerCase();
		if (ext !== '.wav') {
			throw new Error(`Unsupported file format: ${ext}`);
		}

		try {
			const buffer = await fs.promises.readFile(filePath);
			const wav = new WaveFile();
			wav.fromBuffer(buffer);

			const stats = await fs.promises.stat(filePath);
			const fileInfo = this.getFileInfo(filePath, wav, stats);
			const bwf = this.extractBwfData(wav);
			const ixml = this.extractIXMLData(wav);
			const filenameData = this.parseFilename(fileInfo.fileName);

			const show = ixml?.BWFXML?.PROJECT || filenameData.show || bwf.Originator || '';
			let scene = ixml?.BWFXML?.SCENE || filenameData.scene || '';
			let take = ixml?.BWFXML?.TAKE || filenameData.take || '';
			const slate = ixml?.BWFXML?.SLATE || filenameData.slate || '';
			const category = ixml?.BWFXML?.CATEGORY || filenameData.category || '';
			const subcategory = ixml?.BWFXML?.SUBCATEGORY || filenameData.subcategory || '';
			const note = ixml?.BWFXML?.NOTE || bwf.Description || '';

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
				iXML: ixml ?? undefined,
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
		await fs.promises.copyFile(filePath, backupPath);

		try {
			const buffer = await fs.promises.readFile(filePath);
			const wav = new WaveFile();
			wav.fromBuffer(buffer);

			this.updateBwfData(wav, metadata);
			this.updateIXMLData(wav, metadata);

			const outputBuffer = wav.toBuffer();
			await fs.promises.writeFile(filePath, outputBuffer);

			console.log(`Metadata written successfully: ${filePath}`);
		} catch (error) {
			try {
				await fs.promises.copyFile(backupPath, filePath);
			} catch (restoreError) {
				const restoreMsg = restoreError instanceof Error ? restoreError.message : String(restoreError);
				console.error(`CRITICAL: Failed to restore backup for ${filePath}: ${restoreMsg}`);
				throw new Error(
					`Write failed AND backup restore failed for ${filePath}. ` +
					`The file may be corrupted. A backup may exist at ${backupPath}. ` +
					`Original error: ${error instanceof Error ? error.message : String(error)}. ` +
					`Restore error: ${restoreMsg}`
				);
			}
			throw error;
		} finally {
			try {
				await fs.promises.access(backupPath);
				await fs.promises.unlink(backupPath);
			} catch {
				// Backup already cleaned up or doesn't exist
			}
		}
	}

	private parseFilename(fileName: string): Partial<Wavedata> {
		const pattern = /^([^_]+)_([^_]+)_Sc([\d.]+)([A-Z]?)_(\d+)\.wav$/i;
		const match = fileName.match(pattern);

		if (match) {
			const sceneNumber = match[3];
			const slate = match[4] || '';
			const episode = sceneNumber.split('.')[0];

			return {
				show: match[1],
				category: match[2],
				scene: sceneNumber,
				slate,
				take: match[5],
				subcategory: episode,
			};
		}

		return {};
	}

	private getFileInfo(filePath: string, wav: WaveFile, stats: fs.Stats): FileInfo {
		const fmt = wav.fmt as Record<string, number>;
		const data = wav.data as Record<string, { length: number }>;

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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const bext = (wav as any).bext as Record<string, unknown> | undefined;
			if (bext) {
				bwfData.Description = (bext.description as string) || '';
				bwfData.Originator = (bext.originator as string) || '';
				bwfData.OriginatorReference = (bext.originatorReference as string) || '';
				bwfData.OriginationDate = (bext.originationDate as string) || '';
				bwfData.OriginationTime = (bext.originationTime as string) || '';
				if (bext.timeReference && Array.isArray(bext.timeReference)) {
					bwfData.TimeReferenceLow = (bext.timeReference[0] as number) || 0;
					bwfData.TimeReferenceHigh = (bext.timeReference[1] as number) || 0;
				}
				bwfData.CodingHistory = (bext.codingHistory as string) || '';
			}
		} catch (error) {
			console.warn('Error extracting BWF data:', error);
		}
		return bwfData;
	}

	private extractIXMLData(wav: WaveFile): IXMLMetadata | null {
		try {
			const ixmlString = wav.getiXML();
			if (ixmlString && typeof ixmlString === 'string') {
				return this.xmlParser.parse(ixmlString) as IXMLMetadata;
			}
		} catch (error) {
			console.warn('Error parsing iXML data:', error);
		}
		return null;
	}

	private updateBwfData(wav: WaveFile, metadata: Wavedata): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const wavRecord = wav as any;
		const existingBext = (wavRecord.bext ?? {}) as Partial<BWFMetadata>;
		const incomingBwf = metadata.bwf ?? {};

		const updatedBwf: Partial<BWFMetadata> = {
			...existingBext,
			...incomingBwf,
		};

		const trimmedShow = metadata.show?.trim();
		if (trimmedShow && updatedBwf.Originator === undefined) {
			updatedBwf.Originator = trimmedShow;
		}

		if (
			metadata.ixmlNote !== undefined &&
			(metadata.bwf?.Description === undefined || metadata.bwf.Description === '') &&
			(updatedBwf.Description === undefined || updatedBwf.Description === '')
		) {
			updatedBwf.Description = metadata.ixmlNote;
		}

		wavRecord.bext = updatedBwf;
	}

	private updateIXMLData(wav: WaveFile, metadata: Wavedata): void {
		const existingIXML =
			metadata.iXML ??
			this.extractIXMLData(wav) ?? { BWFXML: {} };

		const existingBWFXML = (existingIXML.BWFXML ?? {}) as Record<string, unknown>;
		const updatedBWFXML: Record<string, unknown> = { ...existingBWFXML };

		const assignString = (key: string, value: string | undefined) => {
			if (value !== undefined) updatedBWFXML[key] = value;
		};

		assignString('PROJECT', metadata.show?.trim());
		assignString('SCENE', metadata.scene?.trim());
		assignString('TAKE', metadata.take?.trim());
		assignString('SLATE', metadata.slate?.trim());
		assignString('CATEGORY', metadata.category?.trim());
		assignString('SUBCATEGORY', metadata.subcategory?.trim());
		assignString('NOTE', metadata.ixmlNote ?? (existingBWFXML.NOTE as string | undefined));

		if (metadata.ixmlCircled !== undefined) {
			updatedBWFXML.CIRCLED = metadata.ixmlCircled === 'true';
		}
		if (metadata.ixmlWildtrack !== undefined) {
			updatedBWFXML.WILD_TRACK = metadata.ixmlWildtrack === 'true';
		}

		const updatedIXML: IXMLMetadata = {
			...(existingIXML || {}),
			BWFXML: updatedBWFXML,
		};

		const xmlString = this.xmlBuilder.build(updatedIXML);
		wav.setiXML(xmlString);
	}
}

export const metadataService = new MetadataService();
