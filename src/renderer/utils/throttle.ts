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
			func(...args);
			setTimeout(() => {
				inThrottle = false;
				if (lastArgs) {
					func(...lastArgs);
					lastArgs = null;
				}
			}, limit);
		}
	};
};
