import { readFileSync, unlinkSync } from 'fs';

export function stop(): void {
    const pid = Number(readFileSync('.ducky.pid', 'utf-8'));
    process.kill(pid, 'SIGTERM');
    unlinkSync('.ducky.pid');
    console.log('ducky stopped');
}                                                                                                                                   
        