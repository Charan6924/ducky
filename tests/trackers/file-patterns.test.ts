import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FilePatternWatcher } from '../../src/trackers/file-patterns.js';

vi.mock('fs', () => ({ readdirSync: vi.fn(), statSync: vi.fn() }));
import { readdirSync, statSync } from 'fs';

describe('FilePatternWatcher', () => {
    let watcher: FilePatternWatcher;

    beforeEach(() => {
        watcher = new FilePatternWatcher();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns empty data for empty directory', () => {
        vi.mocked(readdirSync).mockReturnValue([]);

        const data = watcher.getData();
        expect(data.totalFiles).toBe(0);
        expect(data.aiNamedFiles).toBe(0);
        expect(data.burstsDetected).toBe(0);
    });

    it('detects AI-named files', () => {
        vi.mocked(readdirSync).mockReturnValue([
            { name: 'index.ts', isDirectory: () => false },
            { name: 'generated-config.ts', isDirectory: () => false },
            { name: 'ai-helper.ts', isDirectory: () => false },
        ]);
        vi.mocked(statSync).mockReturnValue({ birthtime: new Date() } as any);

        const data = watcher.getData();
        expect(data.aiNamedFiles).toBe(2);
    });
});
