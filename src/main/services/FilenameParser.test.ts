import { describe, it, expect } from 'vitest';
import { FilenameParser } from './FilenameParser';

describe('FilenameParser', () => {
	const parser = new FilenameParser();

	it('matches the Strategy-1 specific regex and derives subcategory from scene', () => {
		const result = parser.parse('MyShow_Dialog_Sc12.3A_007.wav');
		expect(result).toEqual({
			show: 'MyShow',
			category: 'Dialog',
			scene: '12.3',
			slate: 'A',
			take: '007',
			subcategory: '12',
		});
	});

	it('falls back to Strategy-2 with a trailing numeric take', () => {
		const result = parser.parse('Show_FX_KitchenDoor_042.wav');
		expect(result).toEqual({
			show: 'Show',
			category: 'FX',
			scene: 'KitchenDoor',
			take: '042',
		});
	});

	it('falls back to Strategy-2 without a trailing numeric take', () => {
		const result = parser.parse('Show_FX_Ambience.wav');
		// Non-numeric trailing token is treated as part of the scene; take is empty.
		expect(result).toEqual({
			show: 'Show',
			category: 'FX',
			scene: 'Ambience',
			take: '',
		});
	});

	it.each([
		['', null],
		['onlyone.wav', null],
	])('returns null for empty or single-token input (%s)', (input, expected) => {
		expect(parser.parse(input)).toBe(expected);
	});

	it('preserves unicode / accented characters in generic parsing', () => {
		const result = parser.parse('Café_Naïve_Scène_003.wav');
		expect(result).toEqual({
			show: 'Café',
			category: 'Naïve',
			scene: 'Scène',
			take: '003',
		});
	});

	it('handles double underscores as empty delimiter segments', () => {
		// 'Show__Cat_005' -> parts: ['Show', '', 'Cat', '005']. Last is numeric.
		const result = parser.parse('Show__Cat_005.wav');
		expect(result).toEqual({
			show: 'Show',
			category: '',
			scene: 'Cat',
			take: '005',
		});
	});

	it.each(['.WAV', '.Wav', '.wav'])(
		'accepts case-insensitive extension %s for Strategy-1',
		(ext) => {
			const result = parser.parse(`Show_Cat_Sc1.1A_001${ext}`);
			expect(result?.show).toBe('Show');
			expect(result?.take).toBe('001');
		}
	);

	it('accepts case-insensitive extension in Strategy-2 fallback', () => {
		const result = parser.parse('Show_FX_Boom_010.WAV');
		expect(result).toEqual({
			show: 'Show',
			category: 'FX',
			scene: 'Boom',
			take: '010',
		});
	});
});
