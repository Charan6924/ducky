import { fork } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';

export function start(): void {
    const pidPath = '.ducky.pid';

    if (existsSync(pidPath)) {
        const existingPid = Number(readFileSync(pidPath, 'utf-8'));
        try {
            // if kill with 0 signal works, process is running
            process.kill(existingPid, 0);
            console.log('ducky is already tracking (pid ' + existingPid + ')');
            return;
        } catch {
            // process not running — stale PID file, clean it up
            unlinkSync(pidPath);
        }
    }

    const child = fork(join(__dirname, '../daemon.js'), [], {
        stdio: 'ignore',
        detached: true,
    });
    child.unref();
    writeFileSync(pidPath, String(child.pid));
    console.log('ducky started (pid ' + child.pid + ')');
    process.exit(0);
}                                                                                                                                   
                                                                                                                                      