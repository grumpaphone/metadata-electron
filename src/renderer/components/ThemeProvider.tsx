import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { darkTokens, lightTokens, ThemeTokens } from '../theme/tokens';

interface ThemeProviderProps {
	children: React.ReactNode;
}

const attachMediaListener = (
	query: MediaQueryList | undefined,
	handler: () => void
) => {
	if (!query?.addEventListener) return () => undefined;
	query.addEventListener('change', handler);
	return () => query.removeEventListener('change', handler);
};

const applyPalette = (root: HTMLElement, tokens: ThemeTokens) => {
	(Object.entries(tokens) as [string, string][]).forEach(([token, value]) => {
		root.style.setProperty(token, value);
	});
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const isDarkMode = useStore((state) => state.settings.isDarkMode);
	const fontSize = useStore((state) => state.settings.fontSize);
	const [prefersReducedTransparency, setPrefersReducedTransparency] = useState(false);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const transparencyQuery = window.matchMedia('(prefers-reduced-transparency: reduce)');
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const updateTransparency = () => setPrefersReducedTransparency(transparencyQuery?.matches ?? false);
		const updateMotion = () => setPrefersReducedMotion(motionQuery?.matches ?? false);

		updateTransparency();
		updateMotion();

		const cleanups = [
			attachMediaListener(transparencyQuery, updateTransparency),
			attachMediaListener(motionQuery, updateMotion),
		];

		return () => cleanups.forEach((fn) => fn());
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		const body = document.body;

		applyPalette(root, isDarkMode ? darkTokens : lightTokens);

		const fontPx = String(fontSize).replace(/px$/i, '');
		root.style.setProperty('--font-size-base', `${fontPx}px`);
		root.style.setProperty(
			'--glass-navigation',
			prefersReducedTransparency ? 'none' : 'blur(20px) saturate(180%)'
		);
		root.style.setProperty(
			'--glass-modal',
			prefersReducedTransparency ? 'none' : 'blur(30px) saturate(180%)'
		);
		root.style.setProperty('--window-corner-radius', '11px');

		body.classList.remove('theme-dark', 'theme-light');
		body.classList.add(isDarkMode ? 'theme-dark' : 'theme-light');
		body.classList.toggle('reduce-motion', prefersReducedMotion);
		body.classList.toggle('reduce-transparency', prefersReducedTransparency);
	}, [isDarkMode, fontSize, prefersReducedTransparency, prefersReducedMotion]);

	return <>{children}</>;
};
