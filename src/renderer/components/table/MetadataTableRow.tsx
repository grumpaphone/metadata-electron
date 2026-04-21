import React, { useCallback, useState, useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { Wavedata } from '../../../types';
import { PlayIcon, PauseIcon } from '../Icons';
import { basename, formatFileSize, formatTime } from '../../utils/format';

const Row = styled.tr<{ selected?: boolean }>`
	background: ${(props) => props.selected ? 'var(--table-row-selected)' : 'transparent'};
	border-bottom: 1px solid var(--border-secondary);
	user-select: none;
	cursor: pointer;
	transition: background 0.08s ease;

	&:nth-of-type(even) {
		background: ${(props) => props.selected ? 'var(--table-row-selected)' : 'var(--table-row-alt)'};
	}

	&:hover {
		background: var(--table-row-hover);
	}
`;

const Cell = styled.td`
	padding: 6px 8px;
	border-right: 1px solid var(--border-secondary);
	font-size: var(--font-size-base);
	color: var(--text-primary);
	&:last-child { border-right: none; }
`;

const PlayCell = styled(Cell)`
	text-align: center;
	cursor: pointer;
	color: var(--text-secondary);
	transition: color 0.1s ease;

	&:hover {
		color: var(--accent-primary);
	}

	&:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: -2px;
	}
`;

const CellInput = styled.input`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: var(--font-size-base);
	width: 100%;
	box-sizing: border-box;
	background: transparent;
	border: 1px solid transparent;
	border-bottom: 1px dotted var(--cell-editable-hint);
	padding: 2px 4px;
	margin: -2px -4px;
	height: 100%;
	color: var(--text-primary);
	border-radius: 3px;
	transition: border-color 0.1s ease, background 0.1s ease;

	&:hover:not(:focus) {
		border-bottom-color: var(--border-secondary);
	}

	&:focus {
		outline: none;
		background: var(--cell-edit-bg);
		border-color: var(--cell-edit-border);
		border-bottom-style: solid;
	}
`;

const CellWrapper = styled.div<{ isDirty?: boolean }>`
	position: relative;
	background: ${(props) => props.isDirty ? 'var(--cell-dirty-bg)' : 'transparent'};
	border-radius: 3px;
	transition: background 0.15s ease;
`;

const DirtyIndicator = styled.div`
	position: absolute;
	top: 0;
	left: -4px;
	bottom: 0;
	width: 2px;
	background: var(--color-warning);
	border-radius: 1px;
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
		timerRef.current = setTimeout(() => {
			onCommitRef.current(newVal);
			timerRef.current = null;
		}, 150);
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

interface ColumnDef {
	key: string;
	hideable: boolean;
}

interface MetadataTableRowProps {
	file: Wavedata;
	originalFile: Wavedata | undefined;
	rowIndex: number;
	isSelected: boolean;
	isCurrentPlaying: boolean;
	visibleColumns: ColumnDef[];
	onSelect: (filePath: string, ctrlKey: boolean, shiftKey: boolean) => void;
	onContextMenu: (e: React.MouseEvent, filePath: string) => void;
	onCellEdit: (filePath: string, field: keyof Wavedata, value: string) => void;
	onPlayAudio: (file: Wavedata, e: React.MouseEvent | React.KeyboardEvent) => void;
}

const MetadataTableRowInner: React.FC<MetadataTableRowProps> = ({
	file, originalFile, rowIndex, isSelected, isCurrentPlaying,
	visibleColumns, onSelect, onContextMenu, onCellEdit, onPlayAudio,
}) => {
	const handleRowClick = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		if (e.shiftKey) window.getSelection()?.removeAllRanges();
		onSelect(file.filePath, e.ctrlKey || e.metaKey, e.shiftKey);
	}, [file.filePath, onSelect]);

	const handleRightClick = useCallback((e: React.MouseEvent) => {
		onContextMenu(e, file.filePath);
	}, [file.filePath, onContextMenu]);

	const handlePlayKeyDown = useCallback((e: React.KeyboardEvent<HTMLTableCellElement>) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			onPlayAudio(file, e);
		}
	}, [file, onPlayAudio]);

	return (
		<Row
			selected={isSelected}
			onClick={handleRowClick}
			onContextMenu={handleRightClick}
			aria-selected={isSelected}
			aria-rowindex={rowIndex + 1}
			tabIndex={-1}>
			{visibleColumns.map((column) => {
				if (column.key === 'audio') {
					return (
						<PlayCell
							key="audio"
							role="button"
							tabIndex={0}
							aria-label={isCurrentPlaying ? 'Pause' : 'Play'}
							onClick={(e) => onPlayAudio(file, e)}
							onKeyDown={handlePlayKeyDown}>
							{isCurrentPlaying ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
						</PlayCell>
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
							<CellWrapper isDirty={isDirty}>
								{isDirty && <DirtyIndicator />}
								<DebouncedCellInput
									value={fieldValue}
									onCommit={(val) => onCellEdit(file.filePath, column.key as keyof Wavedata, val)}
								/>
							</CellWrapper>
						</Cell>
					);
				}
				if (column.key === 'duration') return <Cell key="duration" style={{ color: 'var(--text-secondary)', fontFamily: "'Monaco', 'Menlo', monospace", fontSize: '11px' }}>{formatTime(file.duration)}</Cell>;
				if (column.key === 'fileSize') return <Cell key="fileSize" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{formatFileSize(file.fileSize)}</Cell>;
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
		prev.rowIndex === next.rowIndex &&
		prev.visibleColumns === next.visibleColumns &&
		prev.onCellEdit === next.onCellEdit &&
		prev.onPlayAudio === next.onPlayAudio &&
		prev.onSelect === next.onSelect &&
		prev.onContextMenu === next.onContextMenu
	);
});
