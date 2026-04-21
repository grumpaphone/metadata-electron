import styled from '@emotion/styled';

/**
 * VibrancyLayer component used for modals, popovers, and dynamic overlays.
 * Applies a translucent background with a backdrop blur, with an opaque
 * fallback for users who prefer reduced transparency.
 */
export const VibrancyLayer = styled.div`
	position: relative;

	border-radius: 16px;
	overflow: hidden;
	border: 1px solid var(--border-primary);

	/* Solid background with subtle glass effect */
	background: var(--bg-glass);
	backdrop-filter: var(--glass-modal);

	/* Minimal shadow like native macOS sheets */
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

	/* Accessibility fallback */
	body.reduce-transparency & {
		backdrop-filter: none;
		background: var(--bg-secondary);
	}
`;
