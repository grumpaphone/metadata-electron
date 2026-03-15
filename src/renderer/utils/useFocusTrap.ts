import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isActive || !containerRef.current) return;

		const container = containerRef.current;
		const focusableSelector =
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

		const getFocusableElements = () =>
			Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
				.filter((el) => !el.hasAttribute('disabled'));

		// Focus the first focusable element
		const focusable = getFocusableElements();
		if (focusable.length > 0) {
			focusable[0].focus();
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== 'Tab') return;

			const elements = getFocusableElements();
			if (elements.length === 0) return;

			const first = elements[0];
			const last = elements[elements.length - 1];

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		};

		container.addEventListener('keydown', handleKeyDown);
		return () => container.removeEventListener('keydown', handleKeyDown);
	}, [isActive]);

	return containerRef;
}
