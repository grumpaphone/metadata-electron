import WaveSurfer from 'wavesurfer.js';

type TimeCallback = (time: number) => void;
type ReadyCallback = (duration: number) => void;
type FinishCallback = () => void;
type ErrorCallback = (error: string) => void;
type SeekCallback = (time: number) => void;

export class WaveSurferController {
	private static instance: WaveSurferController | null = null;
	private ws: WaveSurfer | null = null;
	private blobUrl: string | null = null;
	private pendingRevocation: string | null = null;
	private onTimeUpdate: TimeCallback | null = null;
	private onReady: ReadyCallback | null = null;
	private onFinish: FinishCallback | null = null;
	private onError: ErrorCallback | null = null;
	private onSeek: SeekCallback | null = null;
	private playOnReady = false;
	private lastTimeUpdate = 0;

	static getInstance(): WaveSurferController {
		if (!WaveSurferController.instance) {
			WaveSurferController.instance = new WaveSurferController();
		}
		return WaveSurferController.instance;
	}

	init(container: HTMLElement): void {
		if (this.ws) return;

		const computedStyle = getComputedStyle(document.documentElement);
		const waveColor = computedStyle.getPropertyValue('--waveform-wave').trim();
		const progressColor = computedStyle.getPropertyValue('--waveform-progress').trim();
		const cursorColor = computedStyle.getPropertyValue('--waveform-cursor').trim();

		this.ws = WaveSurfer.create({
			container,
			waveColor: waveColor || '#4a5568',
			progressColor: progressColor || '#007aff',
			cursorColor: cursorColor || '#007aff',
			height: 60,
			normalize: true,
			barWidth: 1,
			barGap: 0.5,
			barRadius: 1,
			interact: true,
		});

		this.ws.on('ready', () => {
			const duration = this.ws!.getDuration();
			if (this.pendingRevocation) {
				URL.revokeObjectURL(this.pendingRevocation);
				this.pendingRevocation = null;
			}
			this.onReady?.(duration);
			if (this.playOnReady) {
				this.ws!.play();
				this.playOnReady = false;
			}
		});

		this.ws.on('audioprocess', (currentTime: number) => {
			const now = Date.now();
			if (now - this.lastTimeUpdate > 100) {
				this.onTimeUpdate?.(currentTime);
				this.lastTimeUpdate = now;
			}
		});

		this.ws.on('finish', () => {
			this.playOnReady = false;
			this.onFinish?.();
		});

		this.ws.on('error', (e: unknown) => {
			this.playOnReady = false;
			if (this.pendingRevocation) {
				URL.revokeObjectURL(this.pendingRevocation);
				this.pendingRevocation = null;
			}
			const msg = e instanceof Error ? e.message : String(e);
			this.onError?.(msg);
		});

		// WaveSurfer v7 emits 'interaction' for click-to-seek with a progress payload (0..1)
		this.ws.on('interaction', (newTime: number) => {
			// In v7, 'interaction' passes the new time in seconds
			this.onSeek?.(newTime);
		});
	}

	setCallbacks(cbs: {
		onTimeUpdate?: TimeCallback;
		onReady?: ReadyCallback;
		onFinish?: FinishCallback;
		onError?: ErrorCallback;
		onSeek?: SeekCallback;
	}): void {
		this.onTimeUpdate = cbs.onTimeUpdate ?? null;
		this.onReady = cbs.onReady ?? null;
		this.onFinish = cbs.onFinish ?? null;
		this.onError = cbs.onError ?? null;
		this.onSeek = cbs.onSeek ?? null;
	}

	loadBlob(audioData: ArrayBuffer, autoPlay: boolean, mimeType?: string): void {
		if (!this.ws) {
			this.onError?.('Cannot load audio: WaveSurfer not initialized');
			return;
		}

		// Defer revocation of previous blob URL until the new one is ready (or errors).
		if (this.blobUrl) {
			// If a prior pending revocation exists, revoke it now — it wasn't cleaned up.
			if (this.pendingRevocation) {
				URL.revokeObjectURL(this.pendingRevocation);
			}
			this.pendingRevocation = this.blobUrl;
		}

		const blob = new Blob([audioData], { type: mimeType ?? 'audio/wav' });
		this.blobUrl = URL.createObjectURL(blob);
		this.playOnReady = autoPlay;
		this.ws.load(this.blobUrl);
	}

	play(): void {
		this.ws?.play();
	}

	pause(): void {
		this.ws?.pause();
	}

	stop(): void {
		this.playOnReady = false;
		if (this.ws) {
			this.ws.stop();
		}
	}

	setVolume(volume: number): void {
		this.ws?.setVolume(volume);
	}

	setPlayOnReady(value: boolean): void {
		this.playOnReady = value;
	}

	isReady(): boolean {
		return this.ws !== null && this.ws.getDuration() > 0;
	}

	destroy(): void {
		if (this.pendingRevocation) {
			URL.revokeObjectURL(this.pendingRevocation);
			this.pendingRevocation = null;
		}
		if (this.blobUrl) {
			URL.revokeObjectURL(this.blobUrl);
			this.blobUrl = null;
		}
		this.ws?.destroy();
		this.ws = null;
		WaveSurferController.instance = null;
	}
}
