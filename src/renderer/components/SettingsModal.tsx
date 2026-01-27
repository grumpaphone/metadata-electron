import React from 'react';
import styled from '@emotion/styled';
import { VibrancyLayer } from './VibrancyLayer';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: var(--modal-overlay);
	backdrop-filter: var(--glass-backdrop);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

const ModalContent = styled(VibrancyLayer)`
	/* VibrancyLayer provides 16px border-radius per Liquid Glass standard */
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
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;

	&:hover {
		background: rgba(140, 183, 255, 0.16);
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
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);

	&:last-child {
		border-bottom: none;
	}
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
	background: ${(props) =>
		props.enabled
			? 'linear-gradient(145deg, rgba(82, 156, 255, 0.95) 0%, rgba(40, 116, 255, 0.92) 100%)'
			: 'rgba(255, 255, 255, 0.16)'};
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 16px;
	width: 48px;
	height: 28px;
	position: relative;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: ${(props) =>
		props.enabled
			? '0 8px 18px rgba(35, 82, 150, 0.35)'
			: 'inset 0 1px 0 rgba(255, 255, 255, 0.25)'};

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
		box-shadow: 0 4px 12px rgba(8, 16, 32, 0.35);
	}

	&:hover {
		transform: translateY(-1px);
	}
`;

const Select = styled.select`
	background: rgba(255, 255, 255, 0.08);
	border: 1px solid rgba(255, 255, 255, 0.16);
	color: var(--text-primary);
	padding: 8px 12px;
	border-radius: 10px;
	font-size: 14px;
	cursor: pointer;
	min-width: 120px;
	backdrop-filter: var(--glass-backdrop);

	&:focus {
		outline: none;
		border-color: rgba(140, 183, 255, 0.6);
	}

	option {
		background: rgba(14, 28, 56, 0.92);
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
	background: ${(props) =>
		props.variant === 'primary'
			? 'linear-gradient(145deg, rgba(82, 156, 255, 0.95) 0%, rgba(40, 116, 255, 0.92) 100%)'
			: 'linear-gradient(145deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.1) 100%)'};
	color: ${(props) =>
		props.variant === 'primary' ? '#ffffff' : 'var(--text-secondary)'};
	border: 1px solid rgba(255, 255, 255, 0.18);
	padding: 10px 20px;
	border-radius: 12px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;
	box-shadow: ${(props) =>
		props.variant === 'primary'
			? '0 12px 24px rgba(32, 78, 145, 0.28)'
			: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'};

	&:hover {
		background: ${(props) =>
			props.variant === 'primary'
				? 'linear-gradient(145deg, rgba(112, 178, 255, 0.98) 0%, rgba(56, 129, 255, 0.96) 100%)'
				: 'linear-gradient(145deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 100%)'};
		transform: translateY(-1px);
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
	isOpen,
	onClose,
	isDarkMode,
	onThemeToggle,
	fontSize,
	onFontSizeChange,
	showTooltips,
	onTooltipsToggle,
}) => {
	if (!isOpen) return null;

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleSave = () => {
		// Settings are automatically saved through the props callbacks
		onClose();
	};

	return (
		<ModalOverlay onClick={handleOverlayClick}>
			<ModalContent intensity='strong'>
				<ModalHeader>
					<Title>Settings</Title>
					<CloseButton onClick={onClose}>×</CloseButton>
				</ModalHeader>

				<Section>
					<SectionTitle>General</SectionTitle>
					<SettingRow>
						<div>
							<SettingLabel>Show tooltips</SettingLabel>
							<SettingDescription>
								Display helpful tooltips on buttons and controls
							</SettingDescription>
						</div>
						<Toggle enabled={showTooltips} onClick={onTooltipsToggle} />
					</SettingRow>
				</Section>

				<Section>
					<SectionTitle>Appearance</SectionTitle>
					<SettingRow>
						<div>
							<SettingLabel>Dark mode</SettingLabel>
							<SettingDescription>
								Toggle between dark and light themes
							</SettingDescription>
						</div>
						<Toggle enabled={isDarkMode} onClick={onThemeToggle} />
					</SettingRow>
					<SettingRow>
						<div>
							<SettingLabel>Font size</SettingLabel>
							<SettingDescription>
								Adjust the font size for metadata fields
							</SettingDescription>
						</div>
						<Select
							value={fontSize}
							onChange={(e) => onFontSizeChange(e.target.value)}>
							<option value='10'>Small (10px)</option>
							<option value='11'>Default (11px)</option>
							<option value='12'>Medium (12px)</option>
							<option value='14'>Large (14px)</option>
						</Select>
					</SettingRow>
				</Section>

				<ButtonContainer>
					<Button variant='secondary' onClick={onClose}>
						Cancel
					</Button>
					<Button variant='primary' onClick={handleSave}>
						Save Settings
					</Button>
				</ButtonContainer>
			</ModalContent>
		</ModalOverlay>
	);
};
