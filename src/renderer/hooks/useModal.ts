import { useEffect } from 'react';

/**
 * Shared modal keyboard handler for Escape-to-close behavior.
 * Pass an optional `guard` that returns false to suppress closing
 * (e.g., during in-flight async work).
 */
export function useModalKeyboard(
	isOpen: boolean,
	onClose: () => void,
	guard?: () => boolean
) {
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				if (guard && !guard()) return;
				e.stopPropagation();
				onClose();
			}
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [isOpen, onClose, guard]);
}
