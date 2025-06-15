import React, { useEffect } from 'react';
import { useStore } from '../store';

interface ThemeProviderProps {
	children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const isDarkMode = useStore((state) => state.settings.isDarkMode);
	const fontSize = useStore((state) => state.settings.fontSize);

	useEffect(() => {
		const root = document.documentElement;

		if (isDarkMode) {
			// Dark theme colors
			root.style.setProperty(
				'--bg-primary',
				'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)'
			);
			root.style.setProperty('--bg-secondary', 'rgba(40, 40, 50, 0.95)');
			root.style.setProperty('--bg-tertiary', 'rgba(50, 50, 60, 0.9)');
			root.style.setProperty('--bg-glass', 'rgba(20, 20, 30, 0.9)');
			root.style.setProperty('--text-primary', '#e0e0e0');
			root.style.setProperty('--text-secondary', '#ccc');
			root.style.setProperty('--text-muted', '#888');
			root.style.setProperty('--border-primary', 'rgba(255, 255, 255, 0.1)');
			root.style.setProperty('--border-secondary', 'rgba(255, 255, 255, 0.05)');
			root.style.setProperty('--accent-primary', '#007aff');
			root.style.setProperty('--accent-hover', '#0056b3');
			root.style.setProperty('--table-row-hover', 'rgba(255, 255, 255, 0.05)');
			root.style.setProperty('--table-row-selected', 'rgba(0, 122, 255, 0.2)');
			root.style.setProperty('--input-bg', 'rgba(0, 0, 0, 0.3)');
			root.style.setProperty('--modal-overlay', 'rgba(0, 0, 0, 0.7)');

			// Audio player specific colors
			root.style.setProperty('--player-bg', 'rgba(20, 20, 30, 0.9)');
			root.style.setProperty('--player-text', 'white');
			root.style.setProperty('--player-text-muted', '#ccc');
			root.style.setProperty('--player-text-dim', '#666');
			root.style.setProperty('--waveform-bg', 'rgba(0, 0, 0, 0.3)');
			root.style.setProperty('--waveform-wave', '#4a5568');
			root.style.setProperty('--waveform-progress', '#007aff');
			root.style.setProperty('--waveform-cursor', '#007aff');

			// Metadata fields and dropdown specific colors
			root.style.setProperty('--input-focus-bg', 'rgba(0, 0, 0, 0.4)');
			root.style.setProperty(
				'--dropdown-bg',
				'linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.98) 100%)'
			);
			root.style.setProperty('--dropdown-border', 'rgba(255, 255, 255, 0.15)');
			root.style.setProperty(
				'--dropdown-item-text',
				'rgba(255, 255, 255, 0.9)'
			);
			root.style.setProperty(
				'--dropdown-item-hover',
				'linear-gradient(90deg, rgba(0, 122, 255, 0.12) 0%, rgba(0, 122, 255, 0.08) 100%)'
			);
		} else {
			// Light theme colors
			root.style.setProperty(
				'--bg-primary',
				'linear-gradient(135deg, rgba(250, 250, 255, 0.95) 0%, rgba(240, 240, 250, 0.98) 100%)'
			);
			root.style.setProperty('--bg-secondary', 'rgba(240, 240, 250, 0.95)');
			root.style.setProperty('--bg-tertiary', 'rgba(230, 230, 240, 0.9)');
			root.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.9)');
			root.style.setProperty('--text-primary', '#2c2c2c');
			root.style.setProperty('--text-secondary', '#444');
			root.style.setProperty('--text-muted', '#666');
			root.style.setProperty('--border-primary', 'rgba(0, 0, 0, 0.1)');
			root.style.setProperty('--border-secondary', 'rgba(0, 0, 0, 0.05)');
			root.style.setProperty('--accent-primary', '#007aff');
			root.style.setProperty('--accent-hover', '#0056b3');
			root.style.setProperty('--table-row-hover', 'rgba(0, 0, 0, 0.05)');
			root.style.setProperty('--table-row-selected', 'rgba(0, 122, 255, 0.15)');
			root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.8)');
			root.style.setProperty('--modal-overlay', 'rgba(0, 0, 0, 0.5)');

			// Audio player specific colors
			root.style.setProperty('--player-bg', 'rgba(255, 255, 255, 0.9)');
			root.style.setProperty('--player-text', '#2c2c2c');
			root.style.setProperty('--player-text-muted', '#666');
			root.style.setProperty('--player-text-dim', '#999');
			root.style.setProperty('--waveform-bg', 'rgba(0, 0, 0, 0.05)');
			root.style.setProperty('--waveform-wave', '#8a8a8a');
			root.style.setProperty('--waveform-progress', '#007aff');
			root.style.setProperty('--waveform-cursor', '#007aff');

			// Metadata fields and dropdown specific colors
			root.style.setProperty('--input-focus-bg', 'rgba(255, 255, 255, 0.9)');
			root.style.setProperty(
				'--dropdown-bg',
				'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 255, 0.98) 100%)'
			);
			root.style.setProperty('--dropdown-border', 'rgba(0, 0, 0, 0.15)');
			root.style.setProperty('--dropdown-item-text', 'rgba(0, 0, 0, 0.8)');
			root.style.setProperty(
				'--dropdown-item-hover',
				'linear-gradient(90deg, rgba(0, 122, 255, 0.08) 0%, rgba(0, 122, 255, 0.04) 100%)'
			);
		}

		// Set font size
		root.style.setProperty('--font-size-base', `${fontSize}px`);

		// Add theme class to body for additional styling
		document.body.className = isDarkMode ? 'theme-dark' : 'theme-light';
	}, [isDarkMode, fontSize]);

	return <>{children}</>;
};
