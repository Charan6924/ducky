import { writeFileSync } from 'fs';
import { TrackerInterface } from './trackers/base.js';

let startTime: string = '';
let projectDir: string = '';

export function initSession(dir: string): void {
    startTime = new Date().toISOString();
    projectDir = dir;
}

export function writeSession(trackers: TrackerInterface[], isFinal: boolean = false): void {
    const data = {
        metadata: {
            startTime,
            endTime: isFinal ? new Date().toISOString() : '',
            projectDir,
        },
        tracking: Object.fromEntries(
            trackers.map(t => [t.name, t.getData()])
        ),
    };
    writeFileSync('ducky.session.json', JSON.stringify(data, null, 2));
}
