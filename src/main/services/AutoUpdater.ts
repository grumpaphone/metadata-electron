/**
 * Auto-updater service.
 *
 * How the update channel works:
 *   - `npm run publish` runs `electron-forge publish`, which packages the app
 *     and uploads artifacts as a GitHub Release (see `publishers` in
 *     forge.config.ts). Releases are created as drafts by default so a human
 *     can review before promoting them.
 *   - Once a release is published (non-draft) on
 *     github.com/grumpaphone/metadata-electron, running clients poll the
 *     Electron public update service every `updateInterval` and auto-download
 *     any newer build.
 *   - `notifyUser: true` shows the native "Update available" dialog and
 *     prompts the user before restarting to apply the update.
 *
 * Required environment for publishing:
 *   - `GITHUB_TOKEN` — personal access token with `repo` scope (and
 *     `workflow` if you publish via CI). Without it, `electron-forge publish`
 *     cannot create the GitHub release.
 *
 * This module is a no-op in development (`!app.isPackaged`) so devs don't
 * get update prompts against unsigned local builds.
 */
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';
import { app } from 'electron';

export function initAutoUpdater() {
	if (!app.isPackaged) return;
	updateElectronApp({
		updateSource: {
			type: UpdateSourceType.ElectronPublicUpdateService,
			repo: 'grumpaphone/metadata-electron',
		},
		updateInterval: '1 hour',
		logger: console, // replace with our logger once one exists
		notifyUser: true,
	});
}
