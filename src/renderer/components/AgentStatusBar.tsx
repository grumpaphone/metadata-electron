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

const AGENT_DISPLAY_NAMES: Record<string, string> = {
	'file-watcher': 'File Watcher',
	'auto-save': 'Auto-save',
};

const formatAgentName = (name: string): string =>
	AGENT_DISPLAY_NAMES[name] ??
	name
		.split(/[-_]/)
		.map((s) => (s[0]?.toUpperCase() ?? '') + s.slice(1))
		.join(' ');

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
					<span>{formatAgentName(agent.name)}</span>
				</StatusItem>
			))}
		</Container>
	);
};
