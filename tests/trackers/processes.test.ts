import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProcessWatcher } from '../../src/trackers/processes.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));
import { execSync } from 'child_process';

describe('ProcessWatcher', () => {
    let watcher: ProcessWatcher;

    beforeEach(() => {
        vi.useFakeTimers();
        watcher = new ProcessWatcher();
        vi.mocked(execSync).mockReturnValue('');
    });

    afterEach(() => {
        watcher.stop();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('detects AI tools from ps output', () => {
        vi.mocked(execSync).mockReturnValue(
            'user   12345   0.0  0.0   claude\nuser   12346   0.0  0.0   copilot'
        );

        watcher.start();
        vi.advanceTimersByTime(5000);

        const data = watcher.getData();
        expect(data.totalSamples).toBe(2);
        expect(data.detected).toContain('claude');
        expect(data.detected).toContain('copilot');
    });

    it('ignores non-AI processes', () => {
        watcher.start();
        vi.advanceTimersByTime(5000);

        const data = watcher.getData();
        expect(data.detected).toEqual([]);
        expect(data.totalSamples).toBe(2);
    });

    it('deduplicates detected tools across samples', () => {
        vi.mocked(execSync).mockReturnValue(
            'user   12345  0.0  0.0   copilot\nuser   12346  0.0  0.0   claude'
        );

        watcher.start();
        vi.advanceTimersByTime(10000);

        const data = watcher.getData();
        expect(data.detected).toEqual(['copilot', 'claude']);
    });

    it('stops polling after stop()', () => {
        watcher.start();
        watcher.stop();
        vi.advanceTimersByTime(10000);

        const data = watcher.getData();
        expect(data.totalSamples).toBe(1);
    });
});
