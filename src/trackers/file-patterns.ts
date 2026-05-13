import { TrackerInterface } from './base.js';

export class FilePatternWatcher implements TrackerInterface {
    readonly name = 'file-patterns';

    start(): void {
        // TODO: watch for burst file creation events
    }

    stop(): void {
        // TODO: stop watching
    }

    getData(): Record<string, unknown> {
        return {};
    }
}
