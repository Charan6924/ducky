import { describe, it, expect } from 'vitest';
import { WindowWatcher } from '../../src/trackers/windows.js';

describe('WindowWatcher', () => {
    it('returns empty data (stub)', () => {
        const watcher = new WindowWatcher();
        expect(watcher.name).toBe('open windows');
        expect(watcher.getData()).toEqual({
            totalSamples: 0,
            currentApp: null,
            currentTitle: null,
            aiDetections: [],
        });
    });
});
