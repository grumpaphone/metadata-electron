import { describe, it, expect } from 'vitest';
import { filterFiles } from './filterUtils';
import type { Wavedata } from '../../types';

// Minimal factory — only the fields the filter touches need realistic values.
const makeFile = (overrides: Partial<Wavedata>): Wavedata =>
	({
		filename: '',
		filePath: '',
		show: '',
		scene: '',
		take: '',
		category: '',
		subcategory: '',
		slate: '',
		ixmlNote: '',
		...overrides,
	} as Wavedata);

describe('filterFiles', () => {
	const files = [
		makeFile({ filename: 'Alpha.wav', show: 'ShowOne', scene: 'Kitchen' }),
		makeFile({ filename: 'Beta.wav', show: 'ShowTwo', scene: 'Garden' }),
		makeFile({ filename: 'Gamma.wav', show: 'ShowOne', scene: 'Kitchen' }),
	];

	it('returns a shallow copy (new array) when search text is empty', () => {
		const result = filterFiles(files, '', 'all');
		expect(result).toEqual(files);
		expect(result).not.toBe(files);
		// Elements are the same references (shallow copy).
		expect(result[0]).toBe(files[0]);
	});

	it('matches case-insensitively across fields', () => {
		const result = filterFiles(files, 'KITCHEN', 'all');
		expect(result.map((f) => f.filename)).toEqual([
			'Alpha.wav',
			'Gamma.wav',
		]);
	});

	it('restricts matching to a specific field when searchField !== "all"', () => {
		// "Garden" appears in scene but we search on show -> no matches.
		expect(filterFiles(files, 'Garden', 'show')).toEqual([]);
		// Scene search finds it.
		const byScene = filterFiles(files, 'Garden', 'scene');
		expect(byScene).toHaveLength(1);
		expect(byScene[0].filename).toBe('Beta.wav');
	});

	it('returns an empty array when the input is empty', () => {
		expect(filterFiles([], 'anything', 'all')).toEqual([]);
		expect(filterFiles([], '', 'all')).toEqual([]);
	});

	it('handles files with undefined fields gracefully', () => {
		const sparse = [
			// Intentionally omit ixmlNote/scene; the helper should coerce undefined -> "".
			{ filename: 'only.wav' } as unknown as Wavedata,
			makeFile({ filename: 'other.wav', scene: 'Forest' }),
		];
		// Searching "all" with a term that doesn't appear anywhere must not throw.
		expect(() => filterFiles(sparse, 'missing', 'all')).not.toThrow();
		// Field-specific search on an undefined field returns nothing but doesn't crash.
		expect(filterFiles(sparse, 'anything', 'ixmlNote')).toEqual([]);
		// Hitting a real scene still works.
		expect(filterFiles(sparse, 'forest', 'scene')).toHaveLength(1);
	});
});
