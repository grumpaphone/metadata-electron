import React from 'react';

interface IconProps {
	size?: number;
	color?: string;
	className?: string;
}

const defaults = { size: 16, color: 'currentColor' };

export const FolderIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M1.5 3.5A1 1 0 0 1 2.5 2.5h3.586a1 1 0 0 1 .707.293L8.207 4.207a.5.5 0 0 0 .354.147H13.5a1 1 0 0 1 1 1v7.146a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V3.5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
	</svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M6.862 1.5h2.276l.325 1.63a5.02 5.02 0 0 1 1.218.703l1.575-.535 1.138 1.97-1.25 1.095a5.08 5.08 0 0 1 0 1.406l1.25 1.094-1.138 1.97-1.575-.534a5.02 5.02 0 0 1-1.218.703l-.325 1.63H6.862l-.325-1.63a5.02 5.02 0 0 1-1.218-.703l-1.575.535-1.138-1.97 1.25-1.095a5.08 5.08 0 0 1 0-1.406l-1.25-1.094 1.138-1.97 1.575.534a5.02 5.02 0 0 1 1.218-.703L6.862 1.5z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
		<circle cx="8" cy="8" r="2" stroke={color} strokeWidth="1.2" />
	</svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill={color} className={className}>
		<path d="M4.5 2.5v11l9-5.5-9-5.5z" />
	</svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill={color} className={className}>
		<rect x="3" y="2" width="3.5" height="12" rx="0.75" />
		<rect x="9.5" y="2" width="3.5" height="12" rx="0.75" />
	</svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill={color} className={className}>
		<rect x="3" y="3" width="10" height="10" rx="1.5" />
	</svg>
);

export const VolumeIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M2 6.5h2.5L8 3.5v9l-3.5-3H2a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5z" fill={color} />
		<path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
		<path d="M12 3.5a6 6 0 0 1 0 9" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
	</svg>
);

export const VolumeMuteIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M2 6.5h2.5L8 3.5v9l-3.5-3H2a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5z" fill={color} />
		<path d="M11 6l3 4M14 6l-3 4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
	</svg>
);

export const DropFileIcon: React.FC<IconProps> = ({ size = 48, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
		<rect x="6" y="4" width="36" height="40" rx="4" stroke={color} strokeWidth="2" />
		<path d="M16 24h16M24 16v16" stroke={color} strokeWidth="2" strokeLinecap="round" />
	</svg>
);

export const WaveformIcon: React.FC<IconProps> = ({ size = 64, color = defaults.color, className }) => (
	<svg width={size} height={size * 0.6} viewBox="0 0 64 38" fill="none" className={className}>
		<path d="M2 19h4M10 12v14M16 8v22M22 14v10M28 6v26M34 10v18M40 14v10M46 8v22M52 12v14M58 19h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
	</svg>
);

export const CheckboxIcon: React.FC<IconProps & { checked: boolean }> = ({ size = 14, color = defaults.color, checked, className }) => (
	<svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
		<rect x="1" y="1" width="12" height="12" rx="3" stroke={color} strokeWidth="1.2" fill={checked ? color : 'none'} />
		{checked && <path d="M4 7l2 2 4-4" stroke={checked ? 'var(--bg-primary)' : color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
	</svg>
);

export const SortAscIcon: React.FC<IconProps> = ({ size = 10, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 10 10" fill={color} className={className}>
		<path d="M5 1L9 7H1L5 1z" />
	</svg>
);

export const SortDescIcon: React.FC<IconProps> = ({ size = 10, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 10 10" fill={color} className={className}>
		<path d="M5 9L1 3h8L5 9z" />
	</svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M4 4l8 8M12 4l-8 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
	</svg>
);

export const KeyboardIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<rect x="1" y="3" width="14" height="10" rx="2" stroke={color} strokeWidth="1.2" />
		<rect x="3.5" y="5.5" width="1.5" height="1.5" rx="0.25" fill={color} />
		<rect x="6" y="5.5" width="1.5" height="1.5" rx="0.25" fill={color} />
		<rect x="8.5" y="5.5" width="1.5" height="1.5" rx="0.25" fill={color} />
		<rect x="11" y="5.5" width="1.5" height="1.5" rx="0.25" fill={color} />
		<rect x="4.5" y="9" width="7" height="1.5" rx="0.5" fill={color} />
	</svg>
);

export const MinimizeIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M4 12l4-4 4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

export const FinderIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<path d="M3 2h7l4 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
		<path d="M10 2v4h4" stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
	</svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = defaults.size, color = defaults.color, className }) => (
	<svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
		<rect x="5" y="5" width="9" height="9" rx="1.5" stroke={color} strokeWidth="1.2" />
		<path d="M3 11V3a1.5 1.5 0 0 1 1.5-1.5H11" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
	</svg>
);
