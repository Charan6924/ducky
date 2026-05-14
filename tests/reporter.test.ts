import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', () => ({ readFileSync: vi.fn(), writeFileSync: vi.fn() }));
import { readFileSync, writeFileSync } from 'fs';
import { generateReport } from '../src/reporter.js';

describe('reporter', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('generates a report from session data', () => {
        vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
            metadata: {
                startTime: '2026-05-14T10:00:00.000Z',
                endTime: '2026-05-14T10:30:00.000Z',
                projectDir: '/test',
            },
            tracking: { processes: { detected: ['claude'] } },
        }));

        generateReport();

        const reportContent = JSON.parse(vi.mocked(writeFileSync).mock.calls[0][1] as string);
        expect(vi.mocked(writeFileSync).mock.calls[0][0]).toBe('ducky-report.json');
        expect(reportContent.metadata.durationsMs).toBe(1800000);
        expect(reportContent.tracking.processes).toEqual({ detected: ['claude'] });
    });

    it('prints summary with duration and tracker count', () => {
        vi.mocked(readFileSync).mockReturnValue(JSON.stringify({
            metadata: {
                startTime: '2026-05-14T10:00:00.000Z',
                endTime: '2026-05-14T10:05:00.000Z',
                projectDir: '/test',
            },
            tracking: { a: {}, b: {} },
        }));

        generateReport();

        expect(vi.mocked(console.log)).toHaveBeenCalledWith('\nducky session complete');
        expect(vi.mocked(console.log)).toHaveBeenCalledWith('duration: 300s');
    });
});
