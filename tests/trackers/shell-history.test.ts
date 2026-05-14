import { describe, it, expect } from 'vitest';
import { ShellHistoryWatcher } from '../../src/trackers/shell-history.js';

describe('ShellHistoryWatcher', () => {
    it('returns empty data (stub)', () => {
        const watcher = new ShellHistoryWatcher();
        expect(watcher.name).toBe('shell history');
        expect(watcher.getData()).toEqual({});
    });
});
