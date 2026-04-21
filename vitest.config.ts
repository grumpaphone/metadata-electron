import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
		coverage: {
			reporter: ['text', 'html'],
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/types.ts'],
		},
	},
});
