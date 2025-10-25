import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

interface ThemeProviderProps {
	children: React.ReactNode;
}

const attachMediaListener = (
	query: MediaQueryList | undefined,
	handler: () => void
) => {
	if (!query || !query.addEventListener) {
		return () => undefined;
	}
	query.addEventListener('change', handler);
	return () => query.removeEventListener('change', handler);
};

const applyPalette = (root: HTMLElement, palette: Record<string, string>) => {
	Object.entries(palette).forEach(([token, value]) => {
		root.style.setProperty(token, value);
	});
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const isDarkMode = useStore((state) => state.settings.isDarkMode);
	const fontSize = useStore((state) => state.settings.fontSize);
	const [prefersReducedTransparency, setPrefersReducedTransparency] =
		useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const transparencyQuery = window.matchMedia(
			'(prefers-reduced-transparency: reduce)'
		);
		const appleTransparencyQuery = window.matchMedia(
			'(-apple-system-reduced-transparency: 1)'
		);
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const updateTransparency = () =>
			setPrefersReducedTransparency(
				(transparencyQuery?.matches || appleTransparencyQuery?.matches) ?? false
			);
		const updateMotion = () =>
			setPrefersReducedMotion(motionQuery?.matches ?? false);

		updateTransparency();
		updateMotion();

		const cleanups = [
			attachMediaListener(transparencyQuery, updateTransparency),
			attachMediaListener(appleTransparencyQuery, updateTransparency),
			attachMediaListener(motionQuery, updateMotion),
		];

		return () => {
			cleanups.forEach((cleanup) => cleanup && cleanup());
		};
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		const body = document.body;

		if (isDarkMode) {
			// Apple's ACTUAL semantic colors from macOS Human Interface Guidelines
			const darkPalette = {
				// System backgrounds (exact Apple colors)
				'--bg-primary': '#1c1c1e', // systemBackground
				'--bg-secondary': '#2c2c2e', // secondarySystemBackground
				'--bg-tertiary': '#3a3a3c', // tertiarySystemBackground
				'--bg-glass': 'rgba(28, 28, 30, 0.85)', // For glass overlays

				// System text colors (exact Apple semantic colors)
				'--text-primary': '#ffffff', // label
				'--text-secondary': 'rgba(235, 235, 245, 0.6)', // secondaryLabel
				'--text-tertiary': 'rgba(235, 235, 245, 0.3)', // tertiaryLabel
				'--text-muted': 'rgba(235, 235, 245, 0.3)', // quaternaryLabel

				// System separators
				'--border-primary': 'rgba(84, 84, 88, 0.65)', // separator
				'--border-secondary': 'rgba(84, 84, 88, 0.32)', // opaqueSeparator

				// System accent colors
				'--accent-primary': '#0a84ff', // systemBlue
				'--accent-hover': '#409cff', // Lighter blue for hover

				// System fills (for buttons, inputs)
				'--fill-primary': 'rgba(120, 120, 128, 0.36)', // systemFill
				'--fill-secondary': 'rgba(120, 120, 128, 0.32)', // secondarySystemFill
				'--fill-tertiary': 'rgba(118, 118, 128, 0.24)', // tertiarySystemFill

				// Minimal shadows (Apple style)
				'--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
				'--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.4)',

				// Table-specific
				'--table-row-hover': 'rgba(255, 255, 255, 0.05)',
				'--table-row-selected': 'rgba(10, 132, 255, 0.15)',

				// Input fields
				'--input-bg': 'rgba(118, 118, 128, 0.24)',
				'--input-border': 'rgba(84, 84, 88, 0.65)',

				// Modal overlay
				'--modal-overlay': 'rgba(0, 0, 0, 0.5)',

				// Audio player
				'--player-bg': '#2c2c2e',
				'--waveform-wave': 'rgba(235, 235, 245, 0.3)',
				'--waveform-progress': '#0a84ff',

				// Dropdowns
				'--dropdown-bg': '#3a3a3c',
				'--dropdown-hover': 'rgba(10, 132, 255, 0.1)',
			};
			applyPalette(root, darkPalette);
		} else {
			// Apple's ACTUAL light mode semantic colors
			const lightPalette = {
				// System backgrounds (exact Apple colors)
				'--bg-primary': '#ffffff', // systemBackground
				'--bg-secondary': '#f2f2f7', // secondarySystemBackground
				'--bg-tertiary': '#ffffff', // tertiarySystemBackground
				'--bg-glass': 'rgba(255, 255, 255, 0.85)', // For glass overlays

				// System text colors (exact Apple semantic colors)
				'--text-primary': '#000000', // label
				'--text-secondary': 'rgba(60, 60, 67, 0.6)', // secondaryLabel
				'--text-tertiary': 'rgba(60, 60, 67, 0.3)', // tertiaryLabel
				'--text-muted': 'rgba(60, 60, 67, 0.18)', // quaternaryLabel

				// System separators
				'--border-primary': 'rgba(60, 60, 67, 0.29)', // separator
				'--border-secondary': 'rgba(60, 60, 67, 0.12)', // opaqueSeparator

				// System accent colors
				'--accent-primary': '#007aff', // systemBlue (slightly different in light mode)
				'--accent-hover': '#0051d5', // Darker blue for hover

				// System fills (for buttons, inputs)
				'--fill-primary': 'rgba(120, 120, 128, 0.2)', // systemFill
				'--fill-secondary': 'rgba(120, 120, 128, 0.16)', // secondarySystemFill
				'--fill-tertiary': 'rgba(118, 118, 128, 0.12)', // tertiarySystemFill

				// Minimal shadows (Apple style)
				'--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.1)',
				'--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.15)',

				// Table-specific
				'--table-row-hover': 'rgba(0, 0, 0, 0.05)',
				'--table-row-selected': 'rgba(0, 122, 255, 0.15)',

				// Input fields
				'--input-bg': 'rgba(118, 118, 128, 0.12)',
				'--input-border': 'rgba(60, 60, 67, 0.29)',

				// Modal overlay
				'--modal-overlay': 'rgba(0, 0, 0, 0.3)',

				// Audio player
				'--player-bg': '#f2f2f7',
				'--waveform-wave': 'rgba(60, 60, 67, 0.3)',
				'--waveform-progress': '#007aff',

				// Dropdowns
				'--dropdown-bg': '#ffffff',
				'--dropdown-hover': 'rgba(0, 122, 255, 0.1)',
			};
			applyPalette(root, lightPalette);
		}

		root.style.setProperty('--font-size-base', `${fontSize}px`);

		// Apple Liquid Glass: MINIMAL glass effects, ONLY on navigation
		// "Liquid Glass seeks to bring attention to the underlying content"
		// "Avoid overusing Liquid Glass effects"
		root.style.setProperty(
			'--glass-navigation',
			prefersReducedTransparency ? 'none' : 'blur(20px) saturate(180%)'
		);
		root.style.setProperty(
			'--glass-modal',
			prefersReducedTransparency ? 'none' : 'blur(30px) saturate(180%)'
		);

		// NO glass tokens for buttons, inputs, or table - keep content crisp

		// Window corner radius (matches native macOS with custom chrome)
		root.style.setProperty('--window-corner-radius', '11px');

		body.classList.remove('theme-dark', 'theme-light');
		body.classList.add(isDarkMode ? 'theme-dark' : 'theme-light');
		body.classList.toggle('reduce-motion', prefersReducedMotion);
		body.classList.toggle('reduce-transparency', prefersReducedTransparency);
	}, [isDarkMode, fontSize, prefersReducedTransparency, prefersReducedMotion]);

	return <>{children}</>;
};
