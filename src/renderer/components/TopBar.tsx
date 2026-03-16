import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';
import { WindowControls } from './WindowControls';
import { useStore } from '../store';
import { FolderIcon, SettingsIcon } from './Icons';

const UnifiedTopBar = styled.div`
	display: flex;
	align-items: center;
	padding: 8px 12px;
	padding-left: 12px;
	gap: 12px;
	height: 52px;
	-webkit-app-region: drag;
	background: var(--bg-secondary);
	backdrop-filter: var(--glass-navigation);
	border-bottom: 1px solid var(--border-primary);
	box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);

	button,
	input,
	div[role='button'] {
		-webkit-app-region: no-drag;
	}
`;

const LeftSection = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	-webkit-app-region: drag;
	button {
		-webkit-app-region: no-drag;
	}
`;

const MiddleSection = styled.div`
	display: flex;
	align-items: center;
	margin-left: auto;
	margin-right: auto;
	font-size: 13px;
	font-weight: 500;
	color: var(--text-muted);
	letter-spacing: 0.5px;
`;

const RightSection = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	position: relative;
	z-index: 200;
`;

const Button = styled.button`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif;
	font-size: 13px;
	font-weight: 510;
	line-height: 1.23077;
	letter-spacing: -0.08px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	padding: 0 12px;
	min-width: 44px;
	height: 28px;
	background: var(--fill-tertiary);
	color: var(--text-primary);
	border: 0.5px solid var(--border-secondary);
	border-radius: 6px;
	cursor: pointer;
	box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.12);
	transition: background 0.1s ease, box-shadow 0.1s ease;

	&:hover:not(:disabled) {
		background: var(--fill-secondary);
		box-shadow: 0 0.5px 2px rgba(0, 0, 0, 0.16);
	}
	&:active:not(:disabled) {
		background: var(--fill-primary);
		box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.12);
		transform: translateY(0.5px);
	}
	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.25);
	}
	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	body.reduce-motion & {
		transition: none;
		transform: none !important;
	}
`;

const IconButton = styled(Button)`
	padding: 0 8px;
	min-width: 28px;
`;

const SaveButton = styled(Button)<{ hasChanges: boolean }>`
	background: ${(props) => props.hasChanges ? 'var(--accent-primary)' : 'var(--fill-tertiary)'};
	color: ${(props) => props.hasChanges ? '#ffffff' : 'var(--text-primary)'};
	border-color: ${(props) => props.hasChanges ? 'transparent' : 'var(--border-secondary)'};

	&:hover:not(:disabled) {
		background: ${(props) => props.hasChanges ? 'var(--accent-hover)' : 'var(--fill-secondary)'};
	}
`;

const PortalTooltip = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	transform: translateX(-50%);
	padding: 6px 10px;
	background: var(--bg-elevated);
	color: var(--text-primary);
	font-size: 12px;
	font-weight: 500;
	border-radius: 6px;
	white-space: nowrap;
	z-index: 400;
	box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
	pointer-events: none;
	animation: tooltipFadeIn 0.2s ease;
	border: 1px solid var(--border-primary);

	&::before {
		content: '';
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-bottom-color: var(--bg-elevated);
	}

	@keyframes tooltipFadeIn {
		from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}
`;

const SearchContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 300px;
	z-index: 200;
	isolation: isolate;
`;

const SearchInput = styled.input`
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif;
	font-size: 13px;
	font-weight: 400;
	line-height: 1.23077;
	letter-spacing: -0.08px;
	display: block;
	width: 100%;
	height: 28px;
	padding: 0 40px 0 7px;
	box-sizing: border-box;
	background: var(--input-bg);
	color: var(--text-primary);
	border: 0.5px solid var(--input-border);
	border-radius: 6px;
	box-shadow: inset 0 0.5px 1px rgba(0, 0, 0, 0.08);
	transition: border-color 0.1s ease, box-shadow 0.1s ease;

	&:hover:not(:focus):not(:disabled) { border-color: var(--border-primary); }
	&:focus {
		outline: none;
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 4px rgba(10, 132, 255, 0.25), inset 0 0.5px 1px rgba(0, 0, 0, 0.08);
	}
	&::placeholder { color: var(--text-muted); opacity: 1; }
	&:disabled { opacity: 0.35; cursor: not-allowed; }
	body.reduce-motion & { transition: none; }
`;

const DropdownArrow = styled.div<{ isOpen: boolean }>`
	position: absolute;
	right: 10px;
	top: 50%;
	transform: translateY(-50%);
	cursor: pointer;
	padding: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 201;
	border-radius: 8px;
	transition: all 0.2s ease;
	background: ${(props) => props.isOpen ? 'var(--dropdown-hover)' : 'transparent'};
	user-select: none;

	&:hover {
		background: var(--table-row-hover);
		transform: translateY(-50%) scale(1.1);
	}

	&::after {
		content: '';
		width: 0; height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid ${(props) => props.isOpen ? 'var(--accent-primary)' : 'var(--text-muted)'};
		transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		transform: ${(props) => (props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
	}
`;

const DropdownMenu = styled.div<{ top: number; left: number }>`
	position: fixed;
	top: ${(props) => props.top}px;
	left: ${(props) => props.left}px;
	background: var(--dropdown-bg);
	border: 1px solid var(--border-primary);
	border-radius: 12px;
	box-shadow: 0 28px 60px rgba(10, 18, 36, 0.35);
	z-index: 300;
	min-width: 160px;
	overflow: hidden;
	isolation: isolate;
	animation: dropdownFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);

	@keyframes dropdownFadeIn {
		from { opacity: 0; transform: translateY(-12px) scale(0.95); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}
`;

const DropdownItem = styled.div<{ isSelected?: boolean }>`
	padding: 12px 18px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 500;
	color: ${(props) => props.isSelected ? 'var(--accent-primary)' : 'var(--text-primary)'};
	transition: background 0.15s ease, color 0.15s ease;
	background: ${(props) => props.isSelected ? 'var(--dropdown-hover)' : 'transparent'};
	user-select: none;

	&:not(:last-of-type)::after {
		content: '';
		position: absolute;
		bottom: 0; left: 12px; right: 12px;
		height: 1px;
		background: var(--border-secondary);
	}

	&:hover {
		background: var(--context-hover);
		color: var(--accent-primary);
	}
`;

interface TooltipButtonProps {
	children: React.ReactNode;
	tooltip: string;
	onClick?: () => void;
	disabled?: boolean;
	className?: string;
	as?: React.ElementType;
}

const TooltipButton: React.FC<TooltipButtonProps> = ({
	children, tooltip, onClick, disabled, className, as: Component = Button,
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const buttonRef = useRef<HTMLButtonElement>(null);
	const showTooltipsEnabled = useStore((state) => state.settings.showTooltips);

	const handleMouseEnter = useCallback(() => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect();
			setPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
		}
		setIsVisible(true);
	}, []);

	return (
		<>
			<Component
				ref={buttonRef}
				onClick={onClick}
				disabled={disabled}
				className={className}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={() => setIsVisible(false)}
				aria-label={tooltip}>
				{children}
			</Component>
			{isVisible && showTooltipsEnabled &&
				createPortal(
					<PortalTooltip top={position.top} left={position.left}>{tooltip}</PortalTooltip>,
					document.body
				)}
		</>
	);
};

const SEARCH_OPTIONS = [
	{ value: 'all', label: 'All Fields' },
	{ value: 'filename', label: 'Filename' },
	{ value: 'show', label: 'Show' },
	{ value: 'category', label: 'Category' },
	{ value: 'subcategory', label: 'Subcategory' },
	{ value: 'scene', label: 'Scene' },
	{ value: 'take', label: 'Take' },
	{ value: 'ixmlNote', label: 'Note' },
];

interface TopBarProps {
	searchText: string;
	searchField: string;
	onSearchChange: (text: string) => void;
	onSearchFieldChange: (text: string, field: string) => void;
	onOpenDirectory: () => void;
	onOpenExtract: () => void;
	onEmbed: () => void;
	onOpenMirror: () => void;
	onOpenSettings: () => void;
	hasFiles: boolean;
	isDirty: boolean;
	showTooltips: boolean;
	statusBar?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
	searchText, searchField, onSearchChange, onSearchFieldChange,
	onOpenDirectory, onOpenExtract, onEmbed, onOpenMirror, onOpenSettings,
	hasFiles, isDirty, showTooltips, statusBar,
}) => {
	const [isFilterOpen, setFilterOpen] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const filterContainerRef = useRef<HTMLDivElement>(null);

	const calculateDropdownPosition = useCallback(() => {
		if (filterContainerRef.current) {
			const rect = filterContainerRef.current.getBoundingClientRect();
			setDropdownPosition({ top: rect.bottom + 12, left: rect.right - 160 });
		}
	}, []);

	const handleDropdownToggle = useCallback(() => {
		if (!isFilterOpen) {
			calculateDropdownPosition();
			setFocusedIndex(SEARCH_OPTIONS.findIndex((o) => o.value === searchField));
		}
		setFilterOpen(!isFilterOpen);
	}, [isFilterOpen, calculateDropdownPosition, searchField]);

	const handleDropdownKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (!isFilterOpen) return;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setFocusedIndex((i) => Math.min(i + 1, SEARCH_OPTIONS.length - 1));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setFocusedIndex((i) => Math.max(i - 1, 0));
				break;
			case 'Enter':
				e.preventDefault();
				if (focusedIndex >= 0 && focusedIndex < SEARCH_OPTIONS.length) {
					onSearchFieldChange(searchText, SEARCH_OPTIONS[focusedIndex].value);
					setFilterOpen(false);
				}
				break;
			case 'Escape':
				e.preventDefault();
				setFilterOpen(false);
				break;
		}
	}, [isFilterOpen, focusedIndex, onSearchFieldChange, searchText]);

	return (
		<UnifiedTopBar>
			<LeftSection>
				<WindowControls />
				<TooltipButton onClick={onOpenDirectory} tooltip="Open directory (Cmd+O)" as={IconButton}>
					<FolderIcon size={15} />
				</TooltipButton>
				<TooltipButton onClick={onOpenExtract} disabled={!hasFiles} tooltip="Extract metadata from filenames (Cmd+E)">
					Extract
				</TooltipButton>
				<SaveButton hasChanges={isDirty} onClick={onEmbed} disabled={!isDirty} aria-label="Save changes to WAV files (Cmd+S)">
					Embed
				</SaveButton>
				<TooltipButton onClick={onOpenMirror} disabled={!hasFiles} tooltip="Mirror files to another location (Cmd+M)">
					Mirror
				</TooltipButton>
			</LeftSection>

			<MiddleSection>
				{statusBar}
			</MiddleSection>

			<RightSection>
				<TooltipButton onClick={onOpenSettings} tooltip="Settings" as={IconButton}>
					<SettingsIcon size={15} />
				</TooltipButton>
				<SearchContainer ref={filterContainerRef} onKeyDown={handleDropdownKeyDown}>
					<SearchInput
						type="text"
						placeholder={searchField === 'all' ? 'Search' : `Search ${SEARCH_OPTIONS.find((o) => o.value === searchField)?.label || 'Filename'}...`}
						value={searchText}
						onChange={(e) => onSearchChange(e.target.value)}
						aria-label="Search files"
					/>
					<DropdownArrow
						isOpen={isFilterOpen}
						onClick={handleDropdownToggle}
						title="Select search field"
						role="button"
						aria-haspopup="listbox"
						aria-expanded={isFilterOpen}
					/>
					{isFilterOpen &&
						createPortal(
							<DropdownMenu top={dropdownPosition.top} left={dropdownPosition.left} role="listbox" aria-label="Search field">
								{SEARCH_OPTIONS.map((option, idx) => (
									<DropdownItem
										key={option.value}
										isSelected={searchField === option.value}
										role="option"
										aria-selected={searchField === option.value}
										style={idx === focusedIndex ? { background: 'var(--context-hover)' } : undefined}
										onClick={() => {
											onSearchFieldChange(searchText, option.value);
											setFilterOpen(false);
										}}>
										{option.label}
									</DropdownItem>
								))}
							</DropdownMenu>,
							document.body
						)}
				</SearchContainer>
			</RightSection>
		</UnifiedTopBar>
	);
};
