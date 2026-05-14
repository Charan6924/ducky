import { readFileSync, writeFileSync } from 'fs';
import { DuckyReport } from './types.js';

interface SessionFile {
    metadata: {
        startTime: string;
        endTime: string;
        projectDir: string;
    };
    tracking: Record<string, unknown>;
}

export function generateReport(): void {
    const raw = readFileSync('ducky.session.json', 'utf-8');
    const session: SessionFile = JSON.parse(raw);

    const startMs = new Date(session.metadata.startTime).getTime();
    const endMs = new Date(session.metadata.endTime).getTime();

    const report: DuckyReport = {
        metadata: {
            startTime: session.metadata.startTime,
            endTime: session.metadata.endTime,
            durationsMs: endMs - startMs,
            projectDir: session.metadata.projectDir,
        },
        tracking: session.tracking,
    };

    writeFileSync('ducky-report.json', JSON.stringify(report, null, 2));

    printSummary(report);
}

function printSummary(report: DuckyReport): void {
    const durationSec = Math.round(report.metadata.durationsMs / 1000);
    const trackerCount = Object.keys(report.tracking).length;

    console.log('\nducky session complete');
    console.log('duration: ' + durationSec + 's');
    console.log('rackers: ' + trackerCount);
    console.log('report:   ducky-report.json\n');
}
