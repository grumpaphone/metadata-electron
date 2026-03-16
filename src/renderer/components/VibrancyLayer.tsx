import styled from '@emotion/styled';

export interface VibrancyLayerProps {
	intensity?: 'light' | 'medium' | 'strong';
}

/**
 * VibrancyLayer component for authentic glass effects
 * Used for modals, popovers, and dynamic overlays
 */
export const VibrancyLayer = styled.div<VibrancyLayerProps>`
	position: relative;

	/* Apple Liquid Glass: 16px for modal components per spec */
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
