import { fork } from 'child_process';
import { join } from 'path';
import { writeFileSync } from 'fs';

export function start(): void {
    const child = fork(join(__dirname, '../daemon.js'));
    writeFileSync('.ducky.pid', String(child.pid));
    console.log('ducky started (pid ' + child.pid + ')');
}                                                                                                                                   
                                                                                                                                      