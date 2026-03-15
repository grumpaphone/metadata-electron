import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Wavedata } from '../../../types';

const METADATA_FONT_SIZE = '11px';

const Row = styled.tr<{ selected?: boolean }>`
	background: ${(props) => props.selected ? 'var(--table-row-selected)' : 'transparent'};
	border-bottom: 1px solid var(--border-secondary);
	user-select: none;
	cursor: pointer;
	&:hover {
		background: var(--table-row-hover);
		box-shadow: inset 0 0 0 1px rgba(122, 175, 255, 0.15);
	}
`;

const Cell = styled.td`
	padding: 8px;
	border-right: 1px solid var(--border-secondary);
	font-size: var(--font-size-base);
	color: var(--text-primary);
	&:last-child { border-right: none; }
`;

const CellInput = styled.input`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: ${METADATA_FONT_SIZE};
	width: 100%;
	box-sizing: border-box;
	background: transparent;
	border: 1px solid transparent;
	padding: 0;
	margin: 0;
	height: 100%;
	color: var(--text-primary);
	&:focus {
		outline: none;
		background: var(--input-bg);
		border-color: var(--accent-primary);
	}
`;

const DirtyDot = styled.div`
	width: 6px; height: 6px;
	background-color: var(--color-warning, #ffc107);
	border-radius: 50%;
	position: absolute;
	top: 4px; right: 4px;
`;

const CellWrapper = styled.div`
	position: relative;
	padding-right: 12px;
`;

const EDITABLE_FIELDS = ['show', 'category', 'subcategory', 'scene', 'take', 'ixmlNote'] as const;

// Debounced input that updates local state immediately but delays store updates
const DebouncedCellInput: React.FC<{
	value: string;
	onCommit: (value: string) => void;
}> = ({ value, onCommit }) => {
	const [local, setLocal] = useState(value);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latestValueRef = useRef(value);
	const onCommitRef = useRef(onCommit);
	onCommitRef.current = onCommit;

	useEffect(() => {
		setLocal(value);
		latestValueRef.current = value;
	}, [value]);

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newVal = e.target.value;
		setLocal(newVal);
		latestValueRef.current = newVal;
		if (timerRef.current) clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => onCommitRef.current(newVal), 150);
	}, []);

	// Flush pending commit on unmount to prevent data loss
	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				onCommitRef.current(latestValueRef.current);
			}
		};
	}, []);

	return <CellInput type="text" value={local} onChange={handleChange} />;
};

const basename = (p: string) => p.split(/[\\/]/).pop() || '';

const formatDuration = (s: number) => {
	if (isNaN(s) || s < 0) return '0:00';
	return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number) => {
	if (isNaN(bytes) || bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

interface ColumnDef {
	key: string;
	hideable: boolean;
}

interface MetadataTableRowProps {
	file: Wavedata;
	originalFile: Wavedata | undefined;
	originalIndex: number;
	isSelected: boolean;
	isCurrentPlaying: boolean;
	visibleColumns: ColumnDef[];
	onSelect: (index: number, ctrlKey: boolean, shiftKey: boolean) => void;
	onContextMenu: (e: React.MouseEvent, index: number) => void;
	onCellEdit: (filePath: string, field: keyof Wavedata, value: string) => void;
	onPlayAudio: (file: Wavedata, e: React.MouseEvent) => void;
}

const MetadataTableRowInner: React.FC<MetadataTableRowProps> = ({
	file, originalFile, originalIndex, isSelected, isCurrentPlaying,
	visibleColumns, onSelect, onContextMenu, onCellEdit, onPlayAudio,
}) => {
	const handleRowClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (e.shiftKey) window.getSelection()?.removeAllRanges();
		onSelect(originalIndex, e.ctrlKey || e.metaKey, e.shiftKey);
	}, [originalIndex, onSelect]);

	const handleRightClick = useCallback((e: React.MouseEvent) => {
		onContextMenu(e, originalIndex);
	}, [originalIndex, onContextMenu]);

	return (
		<Row
			selected={isSelected}
			onClick={handleRowClick}
			onContextMenu={handleRightClick}
			aria-selected={isSelected}>
			{visibleColumns.map((column) => {
				if (column.key === 'audio') {
					return (
						<Cell key="audio" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={(e) => onPlayAudio(file, e)}>
							{isCurrentPlaying ? '⏸' : '▶'}
						</Cell>
					);
				}
				if (column.key === 'filename') {
					return <Cell key="filename">{basename(file.filePath)}</Cell>;
				}
				if (EDITABLE_FIELDS.includes(column.key as typeof EDITABLE_FIELDS[number])) {
					const fieldValue = file[column.key as keyof Wavedata] as string;
					const origValue = originalFile?.[column.key as keyof Wavedata];
					const isDirty = origValue !== fieldValue;
					return (
						<Cell key={column.key} onClick={(e) => e.stopPropagation()}>
							<CellWrapper>
								<DebouncedCellInput
									value={fieldValue}
									onCommit={(val) => onCellEdit(file.filePath, column.key as keyof Wavedata, val)}
								/>
								{isDirty && <DirtyDot />}
							</CellWrapper>
						</Cell>
					);
				}
				if (column.key === 'duration') return <Cell key="duration">{formatDuration(file.duration)}</Cell>;
				if (column.key === 'fileSize') return <Cell key="fileSize">{formatFileSize(file.fileSize)}</Cell>;
				return null;
			})}
		</Row>
	);
};

export const MetadataTableRow = React.memo(MetadataTableRowInner, (prev, next) => {
	return (
		prev.file === next.file &&
		prev.originalFile === next.originalFile &&
		prev.isSelected === next.isSelected &&
		prev.isCurrentPlaying === next.isCurrentPlaying &&
		prev.originalIndex === next.originalIndex &&
		prev.visibleColumns === next.visibleColumns &&
		prev.onCellEdit === next.onCellEdit &&
		prev.onPlayAudio === next.onPlayAudio &&
		prev.onSelect === next.onSelect &&
		prev.onContextMenu === next.onContextMenu
	);
});
