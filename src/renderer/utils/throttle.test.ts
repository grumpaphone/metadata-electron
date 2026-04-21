import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttle } from './throttle';

describe('throttle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('invokes the function immediately on the first call (leading)', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled('a');

		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith('a');
	});

	it('suppresses additional calls within the throttle window', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled('a');
		throttled('b');
		throttled('c');

		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('fires a trailing call exactly once after the interval expires', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled('first');
		throttled('second');

		expect(fn).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(2);
		// Trailing call receives the most recent args.
		expect(fn).toHaveBeenLastCalledWith('second');
	});

	it('produces exactly one leading + one trailing across many rapid calls', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		for (let i = 0; i < 20; i++) {
			throttled(i);
		}

		expect(fn).toHaveBeenCalledTimes(1); // leading only, so far

		vi.advanceTimersByTime(100);

		expect(fn).toHaveBeenCalledTimes(2); // + trailing
		expect(fn).toHaveBeenNthCalledWith(1, 0);
		expect(fn).toHaveBeenNthCalledWith(2, 19);
	});

	it('a single leading-only call does not trigger a redundant trailing call', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 100);

		throttled('solo');
		expect(fn).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(100);

		// No queued trailing args -> still 1 call.
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('trailing call reflects the LATEST args, not the oldest queued ones', () => {
		const fn = vi.fn();
		const throttled = throttle(fn, 50);

		throttled('x', 1);
		throttled('y', 2);
		throttled('z', 3);

		vi.advanceTimersByTime(50);

		expect(fn).toHaveBeenCalledTimes(2);
		expect(fn).toHaveBeenNthCalledWith(1, 'x', 1);
		expect(fn).toHaveBeenNthCalledWith(2, 'z', 3);
	});
});
