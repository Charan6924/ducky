import { existsSync, readFileSync, unlinkSync } from 'fs';
import { generateReport } from '../reporter.js';

export function stop(): void {
    const pidPath = '.ducky.pid';

    if (!existsSync(pidPath)) {
        console.log('no active ducky session');
        return;
    }

    const pid = Number(readFileSync(pidPath, 'utf-8'));

    try {
        process.kill(pid, 'SIGTERM');
        // wait for daemon to exit (poll every 100ms, max 3s)
        for (let i = 0; i < 30; i++) {
            try {
                process.kill(pid, 0);
                Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
            } catch {
                break; // process exited
            }
        }
    } catch {
        console.log('tracking process already exited');
    }

    if (existsSync('ducky.session.json')) {
        generateReport();
    }

    unlinkSync(pidPath);
}                                                                                                                                   
        