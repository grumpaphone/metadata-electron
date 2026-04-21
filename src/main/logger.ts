/* Tiny logger for the main process. Suppresses debug/info in packaged builds
 * unless LOG_LEVEL env var overrides the default. */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
	debug(msg: string, ...args: unknown[]): void;
	info(msg: string, ...args: unknown[]): void;
	warn(msg: string, ...args: unknown[]): void;
	error(msg: string, ...args: unknown[]): void;
	child(scope: string): Logger;
}

const LEVELS: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
};

const resolveDefaultLevel = (): LogLevel => {
	const envLevel = (process.env.LOG_LEVEL ?? '').toLowerCase() as LogLevel;
	if (envLevel in LEVELS) {
		return envLevel;
	}
	try {
		// Lazy-require so this module can be imported in contexts without electron.
		// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
		const electron = require('electron');
		if (electron?.app?.isPackaged) {
			return 'warn';
		}
	} catch {
		if (process.env.NODE_ENV === 'production') return 'warn';
	}
	return 'debug';
};

const minLevel = LEVELS[resolveDefaultLevel()];

const makeLogger = (scope?: string): Logger => {
	const prefix = scope ? `[${scope}] ` : '';
	const emit = (level: LogLevel, msg: string, args: unknown[]) => {
		if (LEVELS[level] < minLevel) return;
		const fn =
			level === 'error'
				? console.error
				: level === 'warn'
					? console.warn
					: level === 'info'
						? console.info
						: console.debug;
		fn(`${prefix}${msg}`, ...args);
	};
	return {
		debug: (msg, ...args) => emit('debug', msg, args),
		info: (msg, ...args) => emit('info', msg, args),
		warn: (msg, ...args) => emit('warn', msg, args),
		error: (msg, ...args) => emit('error', msg, args),
		child: (childScope: string) =>
			makeLogger(scope ? `${scope}:${childScope}` : childScope),
	};
};

export const logger: Logger = makeLogger();
