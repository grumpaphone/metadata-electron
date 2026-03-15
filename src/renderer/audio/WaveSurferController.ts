import WaveSurfer from 'wavesurfer.js';

type TimeCallback = (time: number) => void;
type ReadyCallback = (duration: number) => void;
type FinishCallback = () => void;
type ErrorCallback = (error: string) => void;

export class WaveSurferController {
	private static instance: WaveSurferController | null = null;
	private ws: WaveSurfer | null = null;
	private blobUrl: string | null = null;
	private onTimeUpdate: TimeCallback | null = null;
	private onReady: ReadyCallback | null = null;
	private onFinish: FinishCallback | null = null;
	private onError: ErrorCallback | null = null;
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
			const msg = e instanceof Error ? e.message : String(e);
			this.onError?.(msg);
		});

		this.ws.on('click', (relativeX: number) => {
			this.ws?.seekTo(relativeX);
		});
	}

	setCallbacks(cbs: {
		onTimeUpdate?: TimeCallback;
		onReady?: ReadyCallback;
		onFinish?: FinishCallback;
		onError?: ErrorCallback;
	}): void {
		this.onTimeUpdate = cbs.onTimeUpdate ?? null;
		this.onReady = cbs.onReady ?? null;
		this.onFinish = cbs.onFinish ?? null;
		this.onError = cbs.onError ?? null;
	}

	loadBlob(audioData: ArrayBuffer, autoPlay: boolean): void {
		if (!this.ws) {
			this.onError?.('Cannot load audio: WaveSurfer not initialized');
			return;
		}

		if (this.blobUrl) {
			URL.revokeObjectURL(this.blobUrl);
		}

		const blob = new Blob([audioData], { type: 'audio/wav' });
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
		if (this.ws) {
			this.ws.stop();
		}
	}

	setVolume(volume: number): void {
		this.ws?.setVolume(volume);
	}

	isReady(): boolean {
		return this.ws !== null && this.ws.getDuration() > 0;
	}

	destroy(): void {
		if (this.blobUrl) {
			URL.revokeObjectURL(this.blobUrl);
			this.blobUrl = null;
		}
		this.ws?.destroy();
		this.ws = null;
		WaveSurferController.instance = null;
	}
}
