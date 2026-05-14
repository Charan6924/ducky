import { TrackerInterface } from './base.js';
import { execSync } from 'child_process';

const AI_ENDPOINTS = [
    'api.anthropic.com',
    'api.openai.com',
    'api.github.com',
    'copilot-proxy.githubusercontent.com',
    'cursor.sh',
    'ai.google.dev',
    'api.perplexity.ai',
    'api.deepseek.com'
];

export class NetworkWatcher implements TrackerInterface {
    readonly name = 'network';
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private connections: { process: string; endpoint: string; timestamp: string }[] = [];
    private totalSamples = 0;

    start(): void {
        const poll = (): void => {
            this.totalSamples++;
            try {
                const output = execSync('lsof -i 2>/dev/null', { timeout: 3000 }).toString();
                for (const endpoint of AI_ENDPOINTS) {
                    const regex = new RegExp(`(\\S+)\\s+\\d+.*${endpoint.replace(/\./g, '\\.')}`, 'i');
                    const match = output.match(regex);
                    if (match && match[1]) {
                        this.connections.push({
                            process: match[1],
                            endpoint,
                            timestamp: new Date().toISOString(),
                        });
                    }
                }
            } catch {
                // lsof not available or failed
            }
        };

        poll();
        this.intervalId = setInterval(poll, 10000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getData(): Record<string, unknown> {
        const uniqueEndpoints = [...new Set(this.connections.map(c => c.endpoint))];
        const processes = [...new Set(this.connections.map(c => c.process))];
        return {
            aiConnections: this.connections.length,
            totalSamples: this.totalSamples,
            endpoints: uniqueEndpoints,
            processes,
            connections: this.connections,
        };
    }
}
