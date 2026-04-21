export interface ThemeTokens {
	// Backgrounds
	'--bg-primary': string;
	'--bg-secondary': string;
	'--bg-tertiary': string;
	'--bg-glass': string;
	'--bg-elevated': string;

	// Text
	'--text-primary': string;
	'--text-secondary': string;
	'--text-tertiary': string;
	'--text-muted': string;

	// Borders
	'--border-primary': string;
	'--border-secondary': string;

	// Accents
	'--accent-primary': string;
	'--accent-hover': string;

	// Fills
	'--fill-primary': string;
	'--fill-secondary': string;
	'--fill-tertiary': string;

	// Shadows
	'--shadow-sm': string;
	'--shadow-md': string;

	// Table
	'--table-row-hover': string;
	'--table-row-selected': string;
	'--table-row-alt': string;

	// Inputs
	'--input-bg': string;
	'--input-border': string;
	'--input-focus-bg': string;

	// Cell editing
	'--cell-edit-border': string;
	'--cell-edit-bg': string;
	'--cell-editable-hint': string;
	'--cell-dirty-bg': string;

	// Modal overlay backdrop
	'--modal-overlay': string;

	// Audio player
	'--player-bg': string;
	'--waveform-wave': string;
	'--waveform-progress': string;
	'--waveform-cursor': string;
	'--waveform-bg': string;

	// Dropdowns
	'--dropdown-bg': string;
	'--dropdown-hover': string;

	// Scrollbar
	'--scrollbar-track': string;
	'--scrollbar-thumb': string;
	'--scrollbar-thumb-hover': string;

	// Toggle
	'--toggle-knob': string;

	// Context menu
	'--context-hover': string;
	'--context-danger-hover': string;

	// Drag overlay
	'--drag-overlay-bg': string;
	'--drag-overlay-border': string;
	'--drag-message-bg': string;
	'--drag-message-border': string;

	// Waveform
	'--waveform-border': string;

	// Semantic colors
	'--color-warning': string;
	'--color-error': string;
	'--color-success': string;
}

export const darkTokens: ThemeTokens = {
	'--bg-primary': '#1c1c1e',
	'--bg-secondary': '#2c2c2e',
	'--bg-tertiary': '#3a3a3c',
	'--bg-glass': 'rgba(28, 28, 30, 0.85)',
	'--bg-elevated': '#3a3a3c',

	'--text-primary': '#ffffff',
	'--text-secondary': 'rgba(235, 235, 245, 0.6)',
	'--text-tertiary': 'rgba(235, 235, 245, 0.38)',
	'--text-muted': 'rgba(235, 235, 245, 0.2)',

	'--border-primary': 'rgba(84, 84, 88, 0.65)',
	'--border-secondary': 'rgba(84, 84, 88, 0.32)',

	'--accent-primary': '#0a84ff',
	'--accent-hover': '#409cff',

	'--fill-primary': 'rgba(120, 120, 128, 0.36)',
	'--fill-secondary': 'rgba(120, 120, 128, 0.32)',
	'--fill-tertiary': 'rgba(118, 118, 128, 0.24)',

	'--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
	'--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.4)',

	'--table-row-hover': 'rgba(255, 255, 255, 0.05)',
	'--table-row-selected': 'rgba(10, 132, 255, 0.15)',
	'--table-row-alt': 'rgba(255, 255, 255, 0.02)',

	'--input-bg': 'rgba(118, 118, 128, 0.24)',
	'--input-border': 'rgba(84, 84, 88, 0.65)',
	'--input-focus-bg': 'rgba(118, 118, 128, 0.36)',

	'--cell-edit-border': 'var(--accent-primary)',
	'--cell-edit-bg': 'rgba(118, 118, 128, 0.24)',
	'--cell-editable-hint': 'rgba(235, 235, 245, 0.08)',
	'--cell-dirty-bg': 'rgba(255, 193, 7, 0.08)',

	'--modal-overlay': 'rgba(0, 0, 0, 0.5)',

	'--player-bg': '#2c2c2e',
	'--waveform-wave': 'rgba(235, 235, 245, 0.3)',
	'--waveform-progress': '#0a84ff',
	'--waveform-cursor': '#0a84ff',
	'--waveform-bg': 'rgba(0, 0, 0, 0.25)',

	'--dropdown-bg': '#3a3a3c',
	'--dropdown-hover': 'rgba(10, 132, 255, 0.1)',

	'--scrollbar-track': 'rgba(0, 0, 0, 0.1)',
	'--scrollbar-thumb': 'rgba(255, 255, 255, 0.2)',
	'--scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.3)',

	'--toggle-knob': '#ffffff',

	'--context-hover': 'rgba(120, 173, 255, 0.12)',
	'--context-danger-hover': 'rgba(255, 107, 107, 0.15)',

	'--drag-overlay-bg': 'rgba(90, 150, 255, 0.14)',
	'--drag-overlay-border': 'rgba(120, 173, 255, 0.6)',
	'--drag-message-bg': 'rgba(28, 28, 30, 0.88)',
	'--drag-message-border': 'rgba(120, 173, 255, 0.4)',

	'--waveform-border': 'rgba(255, 255, 255, 0.05)',

	'--color-warning': '#ffc107',
	'--color-error': '#ff453a',
	'--color-success': '#30d158',
};

export const lightTokens: ThemeTokens = {
	'--bg-primary': '#ffffff',
	'--bg-secondary': '#f2f2f7',
	'--bg-tertiary': '#ffffff',
	'--bg-glass': 'rgba(255, 255, 255, 0.85)',
	'--bg-elevated': '#ffffff',

	'--text-primary': '#000000',
	'--text-secondary': 'rgba(60, 60, 67, 0.6)',
	'--text-tertiary': 'rgba(60, 60, 67, 0.3)',
	'--text-muted': 'rgba(60, 60, 67, 0.18)',

	'--border-primary': 'rgba(60, 60, 67, 0.29)',
	'--border-secondary': 'rgba(60, 60, 67, 0.12)',

	'--accent-primary': '#007aff',
	'--accent-hover': '#0051d5',

	'--fill-primary': 'rgba(120, 120, 128, 0.2)',
	'--fill-secondary': 'rgba(120, 120, 128, 0.16)',
	'--fill-tertiary': 'rgba(118, 118, 128, 0.12)',

	'--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
	'--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.15)',

	'--table-row-hover': 'rgba(0, 0, 0, 0.05)',
	'--table-row-selected': 'rgba(0, 122, 255, 0.15)',
	'--table-row-alt': 'rgba(0, 0, 0, 0.02)',

	'--input-bg': 'rgba(118, 118, 128, 0.12)',
	'--input-border': 'rgba(60, 60, 67, 0.29)',
	'--input-focus-bg': 'rgba(118, 118, 128, 0.18)',

	'--cell-edit-border': 'var(--accent-primary)',
	'--cell-edit-bg': 'rgba(118, 118, 128, 0.12)',
	'--cell-editable-hint': 'rgba(60, 60, 67, 0.04)',
	'--cell-dirty-bg': 'rgba(255, 159, 10, 0.08)',

	'--modal-overlay': 'rgba(0, 0, 0, 0.3)',

	'--player-bg': '#f2f2f7',
	'--waveform-wave': 'rgba(60, 60, 67, 0.3)',
	'--waveform-progress': '#007aff',
	'--waveform-cursor': '#007aff',
	'--waveform-bg': 'rgba(0, 0, 0, 0.06)',

	'--dropdown-bg': '#ffffff',
	'--dropdown-hover': 'rgba(0, 122, 255, 0.1)',

	'--scrollbar-track': 'rgba(0, 0, 0, 0.05)',
	'--scrollbar-thumb': 'rgba(0, 0, 0, 0.15)',
	'--scrollbar-thumb-hover': 'rgba(0, 0, 0, 0.25)',

	'--toggle-knob': '#ffffff',

	'--context-hover': 'rgba(0, 122, 255, 0.1)',
	'--context-danger-hover': 'rgba(255, 59, 48, 0.12)',

	'--drag-overlay-bg': 'rgba(0, 122, 255, 0.08)',
	'--drag-overlay-border': 'rgba(0, 122, 255, 0.4)',
	'--drag-message-bg': 'rgba(255, 255, 255, 0.92)',
	'--drag-message-border': 'rgba(0, 122, 255, 0.3)',

	'--waveform-border': 'rgba(0, 0, 0, 0.08)',

	'--color-warning': '#ff9f0a',
	'--color-error': '#ff3b30',
	'--color-success': '#34c759',
};
