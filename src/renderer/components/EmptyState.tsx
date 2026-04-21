import React from 'react';
import styled from '@emotion/styled';
import { WaveformIcon, FolderIcon } from './Icons';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	height: 100%;
	color: var(--text-muted);
	gap: 8px;
	user-select: none;
`;

const IconWrapper = styled.div`
	color: var(--text-tertiary);
	opacity: 0.6;
	margin-bottom: 8px;
`;

const Title = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: var(--text-secondary);
	letter-spacing: -0.2px;
`;

const Subtitle = styled.p`
	margin: 0;
	font-size: 13px;
	color: var(--text-muted);
	max-width: 300px;
	text-align: center;
	line-height: 1.5;
`;

const DropZone = styled.div`
	margin-top: 20px;
	padding: 20px 40px;
	border: 1.5px dashed var(--border-primary);
	border-radius: 12px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	cursor: pointer;
	transition: border-color 0.2s ease, background 0.2s ease;

	&:hover {
		border-color: var(--accent-primary);
		background: var(--table-row-hover);
	}

	&:focus-visible {
		outline: 2px solid var(--accent-primary, #2f7bff);
		outline-offset: 2px;
	}
`;

const OpenButton = styled.button`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: 13px;
	font-weight: 510;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	background: var(--accent-primary);
	color: #ffffff;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: background 0.15s ease;

	&:hover {
		background: var(--accent-hover);
	}

	&:active {
		transform: translateY(0.5px);
	}

	&:focus-visible {
		outline: 2px solid var(--accent-primary, #2f7bff);
		outline-offset: 2px;
	}
`;

const Shortcut = styled.span`
	margin-top: 12px;
	font-size: 12px;
	color: var(--text-muted);
	kbd {
		background: var(--fill-tertiary);
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid var(--border-secondary);
		font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
		font-size: 11px;
		color: var(--text-tertiary);
	}
`;

interface EmptyStateProps {
	onOpenDirectory?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenDirectory }) => {
	const activate = () => {
		onOpenDirectory?.();
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		if (!onOpenDirectory) return;
		if (e.key === 'Enter') {
			e.preventDefault();
			activate();
		} else if (e.key === ' ' || e.key === 'Spacebar') {
			e.preventDefault();
			activate();
		}
	};
	return (
		<Container>
			<IconWrapper>
				<WaveformIcon size={80} />
			</IconWrapper>
			<Title>No Files Loaded</Title>
			<Subtitle>Open a directory or drop WAV files here to start editing metadata.</Subtitle>
			<DropZone
				role="button"
				tabIndex={0}
				aria-label="Open directory or drop files"
				onClick={onOpenDirectory ? activate : undefined}
				onKeyDown={handleKeyDown}
			>
				{onOpenDirectory && (
					<OpenButton
						onClick={(e) => {
							e.stopPropagation();
							activate();
						}}
					>
						<FolderIcon size={14} />
						Open Directory
					</OpenButton>
				)}
				<Subtitle style={{ marginTop: 0, fontSize: '12px' }}>or drag and drop files</Subtitle>
			</DropZone>
			<Shortcut>
				<kbd>Cmd+O</kbd> to open directory
			</Shortcut>
		</Container>
	);
};
