import { TrackerInterface } from './base.js';
import { execSync } from 'child_process';

const AI_TOOLS = ['copilot', 'claude', 'cursor', 'codeium', 'tabnine', 'continue','codex'];

export class ProcessWatcher implements TrackerInterface {
    readonly name = 'processes';
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private detections: { tool: string; timestamp: string }[] = [];
    private totalSamples = 0;

    start(): void {
        const poll = (): void => {
            this.totalSamples++;
            const output = execSync('ps aux').toString();
            for (const tool of AI_TOOLS) {
                if (output.includes(tool)) {
                    this.detections.push({ tool, timestamp: new Date().toISOString() });
                }
            }
        };

        poll(); // run immediately
        this.intervalId = setInterval(poll, 5000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getData(): Record<string, unknown> {
        const unique = [...new Set(this.detections.map(d => d.tool))];
        return {
            detected: unique,
            totalSamples: this.totalSamples,
            detections: this.detections,
        };
    }
}
