import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GitLogWatcher } from '../../src/trackers/git-log.js';

vi.mock('child_process', () => ({ execSync: vi.fn() }));
import { execSync } from 'child_process';

describe('GitLogWatcher', () => {
    let watcher: GitLogWatcher;

    beforeEach(() => {
        watcher = new GitLogWatcher();
    });

    afterEach(() => {
        watcher.stop();
        vi.clearAllMocks();
    });

    it('parses git log output', () => {
        vi.mocked(execSync).mockReturnValue(
            'abc123\n2026-05-14 12:00:00 +0530\nfeat: add feature\n\n\0' +
            'def456\n2026-05-14 11:00:00 +0530\nfix bug\n\n\0'
        );

        watcher.start();

        const data = watcher.getData();
        expect(data.totalCommits).toBe(2);
        expect(data.aiAttributed).toBe(0);
    });

    it('detects Co-Authored-By commits', () => {
        vi.mocked(execSync).mockReturnValue(
            'abc123\n2026-05-14 12:00:00 +0530\nfeat: add feature\n\n\0' +
            'def456\n2026-05-14 11:00:00 +0530\nfeat: ai work\nCo-Authored-By: Claude\0'
        );

        watcher.start();

        const data = watcher.getData();
        expect(data.totalCommits).toBe(2);
        expect(data.aiAttributed).toBe(1);
    });

    it('detects commit bursts', () => {
        vi.mocked(execSync).mockReturnValue(
            'a\n2026-05-14 12:00:00 +0000\nmsg1\n\n\0' +
            'b\n2026-05-14 12:00:10 +0000\nmsg2\n\n\0' +
            'c\n2026-05-14 12:00:20 +0000\nmsg3\n\n\0'
        );

        watcher.start();

        const data = watcher.getData();
        expect(data.burstsDetected).toBe(1);
    });

    it('handles non-git directory gracefully', () => {
        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('not a git repository');
        });

        watcher.start();

        const data = watcher.getData();
        expect(data.totalCommits).toBe(0);
    });
});
