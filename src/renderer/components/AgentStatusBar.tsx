import React from 'react';
import styled from '@emotion/styled';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';

const Container = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 11px;
	color: var(--text-muted);
`;

const StatusDot = styled.div<{ active: boolean }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${(props) => props.active ? 'var(--color-success, #30d158)' : 'var(--text-muted)'};
`;

const StatusItem = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
`;

export const AgentStatusBar: React.FC = () => {
	const agentStatuses = useStoreWithEqualityFn(
		useStore,
		(state) => state.agentStatuses,
		shallow
	);

	if (agentStatuses.length === 0) return null;

	return (
		<Container>
			{agentStatuses.map((agent) => (
				<StatusItem key={agent.name} title={agent.status}>
					<StatusDot active={agent.active} />
					<span>{agent.name === 'file-watcher' ? 'Watch' : agent.name}</span>
				</StatusItem>
			))}
		</Container>
	);
};
