import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('fs', () => ({
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
}));
vi.mock('child_process', () => ({ fork: vi.fn() }));

import * as fs from 'fs';
import * as childProcess from 'child_process';

describe('start command', () => {
    const mockPid = 99999;

    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
        vi.spyOn(process, 'kill').mockImplementation(() => undefined);
        vi.mocked(childProcess.fork).mockReturnValue({ pid: mockPid, unref: vi.fn() } as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('forks daemon and writes PID file', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(false);

        const { start } = await import('../../src/commands/start.js');
        start();

        expect(childProcess.fork).toHaveBeenCalled();
        expect(fs.writeFileSync).toHaveBeenCalledWith('.ducky.pid', String(mockPid));
        expect(console.log).toHaveBeenCalledWith('ducky started (pid ' + mockPid + ')');
    });

    it('reuses existing session if PID is still running', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('12345');

        const { start } = await import('../../src/commands/start.js');
        start();

        expect(childProcess.fork).not.toHaveBeenCalled();
        expect(console.log).toHaveBeenCalledWith('ducky is already tracking (pid 12345)');
    });

    it('cleans stale PID file and starts fresh', async () => {
        vi.mocked(fs.existsSync).mockReturnValue(true);
        vi.mocked(fs.readFileSync).mockReturnValue('12345');
        vi.mocked(process.kill).mockImplementation(() => { throw new Error('not found'); });

        const { start } = await import('../../src/commands/start.js');
        start();

        expect(fs.unlinkSync).toHaveBeenCalledWith('.ducky.pid');
        expect(childProcess.fork).toHaveBeenCalled();
    });
});
