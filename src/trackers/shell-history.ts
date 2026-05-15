import { TrackerInterface } from './base.js';
import { readFileSync} from 'fs';
import { homedir } from 'os';

const AI_COMMANDS = ['claude', 'cursor', 'copilot', 'chatgpt', 'gpt', 'codeium', 'tabnine'];

export class ShellHistoryWatcher implements TrackerInterface{
    readonly name = "shell history";
    private detections: { command: string; timestamp: string }[] = [];

    start() : void{
        try{
            const historyPath = homedir() + '/.zsh_history';
            const content = readFileSync(historyPath, 'utf-8');

            for (const line of content.trim().split('\n')) {
                const semiIndex = line.indexOf(';');
                if (semiIndex === -1) continue;
                const command = line.slice(semiIndex + 1);
                if (AI_COMMANDS.some(c => command.includes(c))) {
                    this.detections.push({ command, timestamp: new Date().toISOString() });
                }
            }
        }catch{
            // do nothing
        }
    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {
            detections: this.detections,
        };
    }
}
