import { existsSync, readFileSync, unlinkSync } from 'fs';
import { generateReport } from '../reporter.js';

function isValidPid(value: number): boolean {
    return Number.isInteger(value) && value > 0;
}

export function stop(): void {
    const pidPath = '.ducky.pid';

    if (!existsSync(pidPath)) {
        console.log('no active ducky session');
        return;
    }

    const raw = readFileSync(pidPath, 'utf-8').trim();
    const pid = Number(raw);

    if (!isValidPid(pid)) {
        console.log('invalid PID file, removing...');
        unlinkSync(pidPath);
        return;
    }

    try {
        process.kill(pid, 'SIGTERM');
    } catch (err: unknown) {
        const nodeErr = err as NodeJS.ErrnoException;
        if (nodeErr.code === 'ESRCH') {
            console.log('tracking process already exited');
        } else {
            console.log('could not stop tracking process: ' + (nodeErr.message || err));
            return;
        }
    }

    // give daemon time to flush session data
    const deadline = Date.now() + 3000;
    while (Date.now() < deadline) {
        try {
            process.kill(pid, 0);
        } catch {
            break; // process exited
        }
    }

    if (existsSync('ducky.session.json')) {
        generateReport();
    }

    unlinkSync(pidPath);
}                                                                                                                                   
        