import { TrackerInterface } from './trackers/base.js';
import { ProcessWatcher } from './trackers/processes.js';
import { FilesystemWatcher } from './trackers/filesystem.js';
import { ShellHistoryWatcher } from './trackers/shell-history.js';
import { WindowWatcher } from './trackers/windows.js';
import { GitLogWatcher } from './trackers/git-log.js';
import { FilePatternWatcher } from './trackers/file-patterns.js';
import { NetworkWatcher } from './trackers/network.js';
import { initSession, writeSession } from './storage.js';

const trackers: TrackerInterface[] = [
    new ProcessWatcher(),
    new FilesystemWatcher(),
    new ShellHistoryWatcher(),
    new WindowWatcher(),
    new GitLogWatcher(),
    new FilePatternWatcher(),
    new NetworkWatcher(),
];

let saveInterval: ReturnType<typeof setInterval> | null = null;

export function run(): void {
    initSession(process.cwd());

    for (const tracker of trackers) {
        tracker.start();
    }

    saveInterval = setInterval(() => writeSession(trackers), 5000);
}

export function shutdown(): void {
    if (saveInterval) {
        clearInterval(saveInterval);
        saveInterval = null;
    }
    writeSession(trackers, true);
    for (const tracker of trackers){
        tracker.stop();
    }
}

process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
});

run();
