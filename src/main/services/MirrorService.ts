import * as fs from 'fs';
import * as path from 'path';
import {
	MirrorConfiguration,
	MirrorResult,
	Wavedata,
	MirrorOrganizeField,
} from '../../types';
import { metadataService } from './MetadataService';

export class MirrorService {
	/**
	 * Mirror files with metadata-based folder organization
	 */
	async mirrorFiles(
		config: MirrorConfiguration,
		allFiles: Wavedata[]
	): Promise<MirrorResult> {
		console.log('[MIRROR] Starting mirror operation with config:', config);

		const result: MirrorResult = {
			success: true,
			copiedFiles: 0,
			errors: [],
			conflicts: [],
		};

		try {
			// Ensure destination directory exists
			await this.ensureDirectoryExists(config.destinationPath);

			// Determine which files to process
			const filesToProcess = config.selectedFiles
				? allFiles.filter((file) =>
						config.selectedFiles?.includes(file.filePath)
				  )
				: allFiles;

			console.log(`[MIRROR] Processing ${filesToProcess.length} files`);

			// Process each file
			for (const file of filesToProcess) {
				try {
					await this.processFile(file, config, result);
				} catch (error) {
					console.error(
						`[MIRROR] Error processing file ${file.filePath}:`,
						error
					);
					result.errors.push({
						filePath: file.filePath,
						error: error instanceof Error ? error.message : String(error),
					});
					result.success = false;
				}
			}

			console.log(
				`[MIRROR] Mirror operation completed. Copied: ${result.copiedFiles}, Errors: ${result.errors.length}`
			);
			return result;
		} catch (error) {
			console.error('[MIRROR] Mirror operation failed:', error);
			result.success = false;
			result.errors.push({
				filePath: 'GENERAL',
				error: error instanceof Error ? error.message : String(error),
			});
			return result;
		}
	}

	/**
	 * Check for potential file conflicts before mirroring
	 */
	async checkFileConflicts(
		config: MirrorConfiguration,
		allFiles: Wavedata[]
	): Promise<string[]> {
		const conflicts: string[] = [];

		const filesToCheck = config.selectedFiles
			? allFiles.filter((file) => config.selectedFiles?.includes(file.filePath))
			: allFiles;

		for (const file of filesToCheck) {
			const destinationPath = this.buildDestinationPath(file, config);
			if (await this.fileExists(destinationPath)) {
				conflicts.push(
					`${file.filename} would overwrite existing file at: ${destinationPath}`
				);
			}
		}

		return conflicts;
	}

	/**
	 * Process a single file for mirroring
	 */
	private async processFile(
		file: Wavedata,
		config: MirrorConfiguration,
		result: MirrorResult
	): Promise<void> {
		const destinationPath = this.buildDestinationPath(file, config);

		// Check if file already exists
		if (await this.fileExists(destinationPath)) {
			// For now, skip existing files. In the future, we could prompt user.
			result.conflicts.push({
				sourcePath: file.filePath,
				destinationPath,
				action: 'skip',
			});
			return;
		}

		// Ensure the directory structure exists
		const destinationDir = path.dirname(destinationPath);
		await this.ensureDirectoryExists(destinationDir);

		// Copy the file
		await fs.promises.copyFile(file.filePath, destinationPath);

		// Re-embed metadata to ensure it's preserved
		await metadataService.writeMetadata(destinationPath, file);

		result.copiedFiles++;
		console.log(`[MIRROR] Copied: ${file.filename} -> ${destinationPath}`);
	}

	/**
	 * Build the destination path based on organization configuration
	 */
	private buildDestinationPath(
		file: Wavedata,
		config: MirrorConfiguration
	): string {
		let currentPath = config.destinationPath;

		// Sort organize levels by order
		const sortedLevels = [...config.organizeLevels].sort(
			(a, b) => a.order - b.order
		);

		// Build folder structure based on organize levels
		for (const level of sortedLevels) {
			const fieldValue = this.getFieldValue(file, level.field);
			const folderName = this.sanitizeFolderName(fieldValue || 'Misc');
			currentPath = path.join(currentPath, folderName);
		}

		// Add the filename
		return path.join(currentPath, file.filename);
	}

	/**
	 * Get the value of a specific field from the file metadata
	 */
	private getFieldValue(
		file: Wavedata,
		field: MirrorOrganizeField
	): string | undefined {
		const value = file[field];
		return value && value.trim() !== '' ? value.trim() : undefined;
	}

	/**
	 * Sanitize folder names to be filesystem-safe
	 */
	private sanitizeFolderName(name: string): string {
		// Replace invalid characters with underscores
		return name
			.replace(/[<>:"/\\|?*]/g, '_')
			.replace(/\s+/g, '_')
			.substring(0, 100); // Limit length
	}

	/**
	 * Check if a file exists
	 */
	private async fileExists(filePath: string): Promise<boolean> {
		try {
			await fs.promises.access(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Ensure a directory exists, creating it if necessary
	 */
	private async ensureDirectoryExists(dirPath: string): Promise<void> {
		try {
			await fs.promises.mkdir(dirPath, { recursive: true });
		} catch (error) {
			console.error(`[MIRROR] Failed to create directory ${dirPath}:`, error);
			throw error;
		}
	}
}

// Export singleton instance
export const mirrorService = new MirrorService();
