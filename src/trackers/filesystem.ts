import { TrackerInterface } from './base.js';
import {watch, FSWatcher} from 'fs';
import { extname } from 'path';

export class FilesystemWatcher implements TrackerInterface{
    readonly name = "file systems";
    private watcher: FSWatcher | null = null;
    private totalEvents = 0;
    private changesByType: Record<string, number> = {};
    private changesByExt: Record<string, number> = {};
    private recentEvents: { file: string; type: string; timestamp: string }[] = [];

    start(): void {
        this.watcher = watch(process.cwd(), { recursive: true }, (eventType, filename) => {
            if (!filename) return;

            this.totalEvents++;
            this.changesByType[eventType] = (this.changesByType[eventType] || 0) + 1;

            const ext = extname(String(filename)).toLowerCase();
            if (ext) {
                this.changesByExt[ext] = (this.changesByExt[ext] || 0) + 1;
            }

            this.recentEvents.push({ file: String(filename), type: eventType, timestamp: new Date().toISOString() });
            if (this.recentEvents.length > 100) this.recentEvents.shift();
        });
    }

    stop(): void {
        try{
            if (this.watcher) {
                this.watcher.close();
                this.watcher = null;
            }
        } catch{
            // do nothign watcher doesnt exist
        }
    }

    getData() : Record<string, unknown>{
        return {
            totalEvents : this.totalEvents,
            changesByType : this.changesByType,
            changesByExt : this.changesByExt,
            recentEvents : this.recentEvents,
        };
    }
}
