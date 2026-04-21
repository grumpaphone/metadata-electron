import { describe, it, expect } from 'vitest';
import { basename, formatFileSize, formatTime } from './format';

describe('basename', () => {
	it.each([
		['/usr/local/bin/node', 'node'],
		['C:\\Users\\will\\file.wav', 'file.wav'],
		// Mixed separators — split regex handles both.
		['/a\\b/c\\d.txt', 'd.txt'],
		['plain.txt', 'plain.txt'],
	])('extracts the final segment of %s', (input, expected) => {
		expect(basename(input)).toBe(expected);
	});

	it('returns empty string for empty input', () => {
		// ''.split(...) -> ['']; .pop() -> ''.
		expect(basename('')).toBe('');
	});

	it('returns empty string for a path ending with a separator', () => {
		expect(basename('/foo/bar/')).toBe('');
		expect(basename('foo\\')).toBe('');
	});
});

describe('formatFileSize', () => {
	it('formats 0 bytes', () => {
		expect(formatFileSize(0)).toBe('0 B');
	});

	it.each([
		// Just below the KB boundary stays in bytes.
		[1023, '1023 B'],
		// Exactly 1024 crosses into KB.
		[1024, '1.0 KB'],
		// 1 MB boundary.
		[1024 * 1024, '1.0 MB'],
		// 1 GB boundary uses 2 decimal places.
		[1024 * 1024 * 1024, '1.00 GB'],
	])('formats %i bytes as %s', (bytes, expected) => {
		expect(formatFileSize(bytes)).toBe(expected);
	});

	it('formats large values above GB using GB with 2 decimals', () => {
		expect(formatFileSize(5 * 1024 * 1024 * 1024)).toBe('5.00 GB');
	});
});

describe('formatTime', () => {
	it.each([
		[0, '0:00'],
		[59, '0:59'],
		[60, '1:00'],
		[61, '1:01'],
		[3600, '60:00'],
	])('formats %i seconds as %s', (secs, expected) => {
		expect(formatTime(secs)).toBe(expected);
	});

	it('returns "0:00" for Infinity', () => {
		expect(formatTime(Infinity)).toBe('0:00');
	});

	it('returns "0:00" for negative values', () => {
		expect(formatTime(-1)).toBe('0:00');
		expect(formatTime(-3600)).toBe('0:00');
	});

	it('returns "0:00" for NaN', () => {
		// NaN fails isFinite, so the guard catches it.
		expect(formatTime(NaN)).toBe('0:00');
	});
});
