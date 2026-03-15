import React from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const Container = styled.div`
	position: fixed;
	top: 52px;
	left: 0;
	right: 0;
	z-index: 50;
	padding: 8px 16px;
	background: var(--bg-secondary);
	border-bottom: 1px solid var(--border-secondary);
	display: flex;
	align-items: center;
	gap: 12px;
`;

const Track = styled.div`
	flex: 1;
	height: 4px;
	background: var(--fill-tertiary);
	border-radius: 2px;
	overflow: hidden;
`;

const Fill = styled.div<{ percent: number }>`
	height: 100%;
	width: ${(props) => props.percent}%;
	background: var(--accent-primary);
	border-radius: 2px;
	transition: width 0.2s ease;
`;

const Label = styled.span`
	font-size: 11px;
	color: var(--text-secondary);
	white-space: nowrap;
	min-width: 120px;
`;

export const ProgressBar: React.FC = () => {
	const progress = useStoreWithEqualityFn(
		useStore,
		(state) => state.loadingProgress,
		shallow
	);

	if (!progress) return null;

	return (
		<Container>
			<Label>
				{progress.fileName} ({progress.processed}/{progress.total})
			</Label>
			<Track>
				<Fill percent={progress.percentage} />
			</Track>
			<Label style={{ minWidth: 'auto' }}>{progress.percentage}%</Label>
		</Container>
	);
};
