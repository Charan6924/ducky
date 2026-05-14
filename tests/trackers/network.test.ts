import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NetworkWatcher } from '../../src/trackers/network.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));
import { execSync } from 'child_process';

describe('NetworkWatcher', () => {
    let watcher: NetworkWatcher;

    beforeEach(() => {
        vi.useFakeTimers();
        watcher = new NetworkWatcher();
    });

    afterEach(() => {
        watcher.stop();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('detects connections to AI endpoints', () => {
        vi.mocked(execSync).mockReturnValue(
            'node 12345 user *:54321 -> api.anthropic.com:443'
        );

        watcher.start();
        vi.advanceTimersByTime(10000);

        const data = watcher.getData();
        expect(data.totalSamples).toBe(2);
        expect(data.aiConnections).toBeGreaterThan(0);
        expect(data.endpoints).toContain('api.anthropic.com');
    });

    it('reports no connections when none found', () => {
        vi.mocked(execSync).mockReturnValue('chrome 12345 user *:54321 -> google.com:443');

        watcher.start();
        vi.advanceTimersByTime(10000);

        const data = watcher.getData();
        expect(data.aiConnections).toBe(0);
        expect(data.endpoints).toEqual([]);
    });

    it('stops polling after stop()', () => {
        vi.mocked(execSync).mockReturnValue('');

        watcher.start();
        watcher.stop();
        vi.advanceTimersByTime(20000);

        const data = watcher.getData();
        expect(data.totalSamples).toBe(1);
    });

    it('handles lsof failure gracefully', () => {
        vi.mocked(execSync).mockImplementation(() => { throw new Error('lsof not found'); });

        watcher.start();
        vi.advanceTimersByTime(10000);

        const data = watcher.getData();
        expect(data.totalSamples).toBe(2);
        expect(data.aiConnections).toBe(0);
    });
});
