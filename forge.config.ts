import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

/**
 * Code-signing / notarization environment variables (macOS):
 *   APPLE_ID            - Apple ID email used for notarization.
 *   APPLE_ID_PASSWORD   - App-specific password for the Apple ID.
 *   APPLE_TEAM_ID       - Apple Developer team identifier.
 * When these are unset, signing and notarization are skipped so local
 * `electron-forge package`/`make` invocations still succeed.
 */
const config: ForgeConfig = {
	packagerConfig: {
		asar: true,
		appBundleId: 'com.metadata-electron.app',
		appCategoryType: 'public.app-category.productivity',
		// icon: './assets/icon',   // TODO: add assets/icon.icns and assets/icon.ico
		osxSign: process.env.APPLE_ID ? {} : undefined,
		osxNotarize: process.env.APPLE_ID
			? {
				appleId: process.env.APPLE_ID!,
				appleIdPassword: process.env.APPLE_ID_PASSWORD!,
				teamId: process.env.APPLE_TEAM_ID!,
			}
			: undefined,
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerRpm({}),
		new MakerDeb({}),
	],
	publishers: [
		new PublisherGithub({
			repository: { owner: 'grumpaphone', name: 'metadata-electron' },
			prerelease: false,
			draft: true, // default to draft so user reviews before releasing
		}),
	],
	plugins: [
		new AutoUnpackNativesPlugin({}),
		new WebpackPlugin({
			mainConfig,
			// Production CSP is set via <meta> in renderer/index.html — do not grant unsafe-eval in prod.
			devContentSecurityPolicy:
				"default-src 'self' 'unsafe-inline' data: blob:; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' data:; connect-src 'self' ws:;",
			port: 3001,
			loggerPort: 9002,
			renderer: {
				config: rendererConfig,
				entryPoints: [
					{
						html: './src/renderer/index.html',
						js: './src/renderer/index.tsx',
						name: 'main_window',
						preload: {
							js: './src/preload.ts',
						},
					},
				],
			},
		}),
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};

export default config;
