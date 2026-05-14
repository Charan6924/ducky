import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilesystemWatcher } from '../../src/trackers/filesystem.js';
import { EventEmitter } from 'events';

vi.mock('fs', () => ({ watch: vi.fn() }));
import { watch } from 'fs';

describe('FilesystemWatcher', () => {
    let watcher: FilesystemWatcher;
    let mockEmitter: EventEmitter;
    let watchCallback: (...args: any[]) => void;

    beforeEach(() => {
        watcher = new FilesystemWatcher();
        mockEmitter = new EventEmitter();
        vi.mocked(watch).mockImplementation((...args: any[]) => {
            watchCallback = args[args.length - 1]; // last arg is the callback
            return mockEmitter as any;
        });
    });

    afterEach(() => {
        watcher.stop();
        vi.clearAllMocks();
    });

    it('tracks file change events', () => {
        watcher.start();

        watchCallback('change', 'src/index.ts');
        watchCallback('rename', 'src/newfile.ts');

        const data = watcher.getData();
        expect(data.totalEvents).toBe(2);
        expect(data.changesByType).toEqual({ change: 1, rename: 1 });
        expect(data.changesByExt).toEqual({ '.ts': 2 });
    });

    it('tracks changes by extension', () => {
        watcher.start();
        watchCallback('change', 'file.ts');
        watchCallback('change', 'file.css');
        watchCallback('change', 'file.ts');

        const data = watcher.getData();
        expect(data.changesByExt).toEqual({ '.ts': 2, '.css': 1 });
    });

    it('ignores own session/report files', () => {
        watcher.start();
        watchCallback('change', 'ducky.session.json');
        watchCallback('change', 'ducky-report.json');
        watchCallback('change', '.ducky.pid');
        watchCallback('change', 'src/index.ts');

        const data = watcher.getData();
        expect(data.totalEvents).toBe(1);
    });

    it('handles null filename', () => {
        watcher.start();
        watchCallback('change', null);

        const data = watcher.getData();
        expect(data.totalEvents).toBe(0);
    });

    it('closes watcher on stop()', () => {
        const closeSpy = vi.fn();
        mockEmitter.close = closeSpy;

        watcher.start();
        watcher.stop();

        expect(closeSpy).toHaveBeenCalled();
    });
});
