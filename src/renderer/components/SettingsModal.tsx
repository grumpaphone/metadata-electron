import React from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0; left: 0; right: 0; bottom: 0;
	background: var(--modal-overlay);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
`;

const ModalContent = styled(VibrancyLayer)`
	padding: 24px;
	width: 500px;
	max-width: 90vw;
	max-height: 80vh;
	overflow-y: auto;
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid var(--border-secondary);
`;

const Title = styled.h2`
	margin: 0;
	color: var(--text-primary);
	font-size: 20px;
	font-weight: 600;
`;

const CloseButton = styled.button`
	background: transparent;
	border: 1px solid transparent;
	color: var(--text-muted);
	font-size: 24px;
	cursor: pointer;
	padding: 4px;
	border-radius: 8px;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	&:hover {
		background: var(--fill-tertiary);
		color: var(--accent-primary);
	}
`;

const Section = styled.div`
	margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	color: var(--text-secondary);
	font-size: 16px;
	font-weight: 500;
`;

const SettingRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid var(--border-secondary);
	&:last-child { border-bottom: none; }
`;

const SettingLabel = styled.div`
	color: var(--text-primary);
	font-size: 14px;
	font-weight: 500;
`;

const SettingDescription = styled.div`
	color: var(--text-muted);
	font-size: 12px;
	margin-top: 4px;
`;

const Toggle = styled.button<{ enabled: boolean }>`
	background: ${(props) => props.enabled ? 'var(--accent-primary)' : 'var(--fill-primary)'};
	border: 1px solid var(--border-secondary);
	border-radius: 16px;
	width: 48px;
	height: 28px;
	position: relative;
	cursor: pointer;
	transition: all 0.2s ease;

	&::after {
		content: '';
		position: absolute;
		top: 2px;
		left: ${(props) => (props.enabled ? '22px' : '2px')};
		width: 24px;
		height: 24px;
		background: white;
		border-radius: 50%;
		transition: left 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
`;

const Select = styled.select`
	background: var(--input-bg);
	border: 1px solid var(--input-border);
	color: var(--text-primary);
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	min-width: 120px;
	&:focus {
		outline: none;
		border-color: var(--accent-primary);
	}
	option {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
	padding-top: 16px;
	border-top: 1px solid var(--border-secondary);
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	background: ${(props) => props.variant === 'primary' ? 'var(--accent-primary)' : 'var(--fill-tertiary)'};
	color: ${(props) => props.variant === 'primary' ? '#ffffff' : 'var(--text-secondary)'};
	border: 1px solid var(--border-secondary);
	padding: 10px 20px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;
	&:hover {
		background: ${(props) => props.variant === 'primary' ? 'var(--accent-hover)' : 'var(--fill-secondary)'};
	}
`;

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	isDarkMode: boolean;
	onThemeToggle: () => void;
	fontSize: string;
	onFontSizeChange: (size: string) => void;
	showTooltips: boolean;
	onTooltipsToggle: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
	isOpen, onClose, isDarkMode, onThemeToggle,
	fontSize, onFontSizeChange, showTooltips, onTooltipsToggle,
}) => {
	if (!isOpen) return null;

	return (
		<ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
			<ModalContent intensity="strong" role="dialog" aria-modal="true" aria-label="Settings">
				<ModalHeader>
					<Title>Settings</Title>
					<CloseButton onClick={onClose} aria-label="Close settings">×</CloseButton>
				</ModalHeader>

				<Section>
					<SectionTitle>General</SectionTitle>
					<SettingRow>
						<div>
							<SettingLabel>Show tooltips</SettingLabel>
							<SettingDescription>Display helpful tooltips on buttons and controls</SettingDescription>
						</div>
						<Toggle enabled={showTooltips} onClick={onTooltipsToggle} aria-label="Toggle tooltips" />
					</SettingRow>
				</Section>

				<Section>
					<SectionTitle>Appearance</SectionTitle>
					<SettingRow>
						<div>
							<SettingLabel>Dark mode</SettingLabel>
							<SettingDescription>Toggle between dark and light themes</SettingDescription>
						</div>
						<Toggle enabled={isDarkMode} onClick={onThemeToggle} aria-label="Toggle dark mode" />
					</SettingRow>
					<SettingRow>
						<div>
							<SettingLabel>Font size</SettingLabel>
							<SettingDescription>Adjust the font size for metadata fields</SettingDescription>
						</div>
						<Select value={fontSize} onChange={(e) => onFontSizeChange(e.target.value)}>
							<option value="10">Small (10px)</option>
							<option value="11">Default (11px)</option>
							<option value="12">Medium (12px)</option>
							<option value="14">Large (14px)</option>
						</Select>
					</SettingRow>
				</Section>

				<ButtonContainer>
					<Button variant="secondary" onClick={onClose}>Cancel</Button>
					<Button variant="primary" onClick={onClose}>Save Settings</Button>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
