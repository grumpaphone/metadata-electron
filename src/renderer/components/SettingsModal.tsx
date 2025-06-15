import React from 'react';
import styled from '@emotion/styled';

const ModalOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(8px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
`;

const ModalContent = styled.div`
	background: linear-gradient(
		135deg,
		rgba(40, 40, 50, 0.95) 0%,
		rgba(30, 30, 40, 0.98) 100%
	);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 12px;
	padding: 24px;
	width: 500px;
	max-width: 90vw;
	max-height: 80vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h2`
	margin: 0;
	color: #e0e0e0;
	font-size: 20px;
	font-weight: 600;
`;

const CloseButton = styled.button`
	background: none;
	border: none;
	color: #888;
	font-size: 24px;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
	}
`;

const Section = styled.div`
	margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	color: #ccc;
	font-size: 16px;
	font-weight: 500;
`;

const SettingRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.05);

	&:last-child {
		border-bottom: none;
	}
`;

const SettingLabel = styled.div`
	color: #e0e0e0;
	font-size: 14px;
	font-weight: 500;
`;

const SettingDescription = styled.div`
	color: #888;
	font-size: 12px;
	margin-top: 4px;
`;

const Toggle = styled.button<{ enabled: boolean }>`
	background: ${(props) => (props.enabled ? '#007aff' : '#444')};
	border: none;
	border-radius: 16px;
	width: 48px;
	height: 28px;
	position: relative;
	cursor: pointer;
	transition: background 0.2s ease;

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

	&:hover {
		background: ${(props) => (props.enabled ? '#0056b3' : '#555')};
	}
`;

const Select = styled.select`
	background: rgba(0, 0, 0, 0.3);
	border: 1px solid rgba(255, 255, 255, 0.1);
	color: #e0e0e0;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	min-width: 120px;

	&:focus {
		outline: none;
		border-color: #007aff;
	}

	option {
		background: #333;
		color: #e0e0e0;
	}
`;

const ButtonContainer = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
	margin-top: 24px;
	padding-top: 16px;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	background: ${(props) =>
		props.variant === 'primary' ? '#007aff' : 'rgba(255, 255, 255, 0.1)'};
	color: ${(props) => (props.variant === 'primary' ? 'white' : '#e0e0e0')};
	border: 1px solid
		${(props) =>
			props.variant === 'primary' ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
	padding: 10px 20px;
	border-radius: 6px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	transition: all 0.2s ease;

	&:hover {
		background: ${(props) =>
			props.variant === 'primary' ? '#0056b3' : 'rgba(255, 255, 255, 0.15)'};
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
			<ModalContent>
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
