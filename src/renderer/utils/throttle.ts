type AnyFunction = (...args: any[]) => any;

/**
 * Throttle function for performance-critical event handlers
 * Ensures function is called at most once per `limit` milliseconds
 */
export const throttle = <T extends AnyFunction>(
	func: T,
	limit: number
): ((...args: Parameters<T>) => void) => {
	let inThrottle = false;
	let lastArgs: Parameters<T> | null = null;

	return (...args: Parameters<T>) => {
		lastArgs = args;
		if (!inThrottle) {
			inThrottle = true;
			// Clear stored args so a leading-only call doesn't trigger a
			// redundant trailing invocation with the same arguments.
			lastArgs = null;
			func(...args);
			setTimeout(() => {
				inThrottle = false;
				if (lastArgs !== null) {
					const pending = lastArgs;
					lastArgs = null;
					func(...pending);
				}
			}, limit);
		}
	};
};
