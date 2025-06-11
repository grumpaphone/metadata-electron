import { Wavedata } from '../../types';

export class FilenameParser {
	parse(filename: string): Partial<Wavedata> | null {
		// Strategy 1: Try to parse using the specific '..._Sc#.#S_##.wav' format
		const specificRegex = /^([^_]+)_([^_]+)_Sc([\d.]+)([A-Z]?)_(\d+)\.wav$/i;
		const specificMatch = filename.match(specificRegex);

		if (specificMatch) {
			// prettier-ignore
			const [, show, category, scene, slate, take] = specificMatch;
			return {
				show,
				category,
				scene,
				slate,
				take,
				subcategory: scene.split('.')[0] || '',
			};
		}

		// Strategy 2: Fallback to a generic underscore-based parsing
		const genericParts = filename.replace(/\.wav$/i, '').split('_');
		if (genericParts.length >= 2) {
			let take = '';
			let scene = '';

			// If the last part is numeric, assume it's the take number
			if (
				genericParts.length > 2 &&
				/^\d+$/.test(genericParts[genericParts.length - 1])
			) {
				take = genericParts.pop() as string;
				scene = genericParts.slice(2).join('_');
			} else if (genericParts.length > 2) {
				// Otherwise, everything after the second part is the scene
				scene = genericParts.slice(2).join('_');
			}

			return {
				show: genericParts[0],
				category: genericParts[1],
				scene,
				take,
			};
		}

		// If no strategy works, return null
		return null;
	}
}

export const filenameParser = new FilenameParser();
