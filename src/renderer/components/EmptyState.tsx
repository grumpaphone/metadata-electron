import React from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: var(--text-muted);
`;

export const EmptyState: React.FC = () => (
	<Container>
		<h3>No Files Loaded</h3>
		<p>Select a directory or drop files here to get started.</p>
	</Container>
);
