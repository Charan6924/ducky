import { writeFileSync } from 'fs';
import { TrackerInterface } from './trackers/base.js';

export function writeSession(trackers: TrackerInterface[]): void {
    const data = {
        metadata: {
            timestamp: new Date().toISOString(),
        },
        tracking: Object.fromEntries(
            trackers.map(t => [t.name, t.getData()])
        ),
    };
    writeFileSync('ducky.session.json', JSON.stringify(data, null, 2));
}
