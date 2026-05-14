import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => ({ writeFileSync: vi.fn() }));
import { writeFileSync } from 'fs';

import { initSession, writeSession } from '../src/storage.js';

describe('storage', () => {
    beforeEach(() => {
        vi.mocked(writeFileSync).mockClear();
    });

    it('stores start time and project dir', () => {
        initSession('/test/project');
        writeSession([{ name: 'test', start: vi.fn(), stop: vi.fn(), getData: () => ({}) }]);

        const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
        expect(written.metadata.projectDir).toBe('/test/project');
        expect(written.metadata.startTime).toBeTruthy();
        expect(written.metadata.endTime).toBe('');
    });

    it('sets endTime when isFinal is true', () => {
        initSession('/test');
        writeSession([], true);

        const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
        expect(written.metadata.endTime).toBeTruthy();
    });

    it('includes tracker data', () => {
        initSession('/test');
        writeSession([{ name: 'tracker1', start: vi.fn(), stop: vi.fn(), getData: () => ({ files: 5 }) }]);

        const written = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
        expect(written.tracking.tracker1).toEqual({ files: 5 });
    });

    it('writes to ducky.session.json', () => {
        initSession('/test');
        writeSession([]);

        expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe('ducky.session.json');
    });
});
