import { TrackerInterface } from './base.js';
import { readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const AI_FILE_PATTERNS = ['generated', 'ai-', '.cursor', '.copilot-'];

export class FilePatternWatcher implements TrackerInterface {
    readonly name = 'file-patterns';
    private cachedData: Record<string, unknown> | null = null;
    private lastScan = 0;
    private readonly scanInterval = 60000;

    start(): void {
        // static analysis — work happens in getData()
    }

    stop(): void {
        // no-op
    }

    getData(): Record<string, unknown> {
        const now = Date.now();
        if (this.cachedData && now - this.lastScan < this.scanInterval) {
            return this.cachedData;
        }

        const files = this.walkDir(process.cwd());

        // files with AI-associated naming patterns
        const aiNamed = files.filter(f =>
            AI_FILE_PATTERNS.some(p => basename(f).toLowerCase().includes(p))
        );

        // burst detection: 3+ files created within 60s
        const withTimes = files
            .map(f => {
                try {
                    const s = statSync(f);
                    return { file: f, birthtime: s.birthtime.getTime() };
                } catch { return null; }
            })
            .filter((f): f is { file: string; birthtime: number } => f !== null)
            .sort((a, b) => a.birthtime - b.birthtime);

        const bursts: { startTime: string; count: number; files: string[] }[] = [];
        let i = 0;
        while (i < withTimes.length - 2) {
            const windowEnd = withTimes[i + 2].birthtime;
            if (windowEnd - withTimes[i].birthtime < 60000) {
                let j = i + 3;
                while (j < withTimes.length && withTimes[j].birthtime - withTimes[i].birthtime < 60000) j++;
                const burst = withTimes.slice(i, j);
                bursts.push({
                    startTime: new Date(burst[0].birthtime).toISOString(),
                    count: burst.length,
                    files: burst.map(f => f.file),
                });
                i = j;
            } else {
                i++;
            }
        }

        this.cachedData = {
            totalFiles: files.length,
            aiNamedFiles: aiNamed.length,
            aiNamedExamples: aiNamed.slice(0, 20),
            burstsDetected: bursts.length,
            burstWindows: bursts,
        };
        this.lastScan = now;
        return this.cachedData;
    }

    private walkDir(dir: string): string[] {
        const result: string[] = [];
        try {
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
                const full = join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name !== '.git' && entry.name !== 'node_modules') {
                        result.push(...this.walkDir(full));
                    }
                } else {
                    result.push(full);
                }
            }
        } catch {
            // skip dirs we can't read
        }
        return result;
    }
}
