import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
}));
vi.mock('../../src/reporter.js', () => ({ generateReport: vi.fn() }));

import * as fs from 'fs';
import * as reporter from '../../src/reporter.js';

describe('stop command', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(process, 'kill').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('prints message when no active session', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const { stop } = await import('../../src/commands/stop.js');
        stop();

        expect(vi.mocked(console.log)).toHaveBeenCalledWith('no active ducky session');
    });

    it('handles invalid PID file', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('not-a-number');

        const { stop } = await import('../../src/commands/stop.js');
        stop();

        expect(vi.mocked(console.log)).toHaveBeenCalledWith('invalid PID file, removing...');
        expect(fs.unlinkSync).toHaveBeenCalledWith('.ducky.pid');
    });

    it('kills daemon and generates report on stop', async () => {
        vi.mocked(fs.existsSync).mockImplementation((path) => {
            if (path === '.ducky.pid') return true;
            if (path === 'ducky.session.json') return true;
            return false;
        });
        vi.mocked(fs.readFileSync).mockReturnValue('12345');

        const { stop } = await import('../../src/commands/stop.js');
        stop();

        expect(process.kill).toHaveBeenCalledWith(12345, 'SIGTERM');
        expect(reporter.generateReport).toHaveBeenCalled();
    });
});
