import { TrackerInterface } from './base.js';
import { execSync } from 'child_process'

const aiWindows = [
    'cursor', 'claude', 'chatgpt', 'copilot', 'codeium', 'tabnine',
    'chat.openai.com', 'anthropic',
];

export class WindowWatcher implements TrackerInterface{
    readonly name = "open windows";
    private totalSamples : number = 0;
    private currentApp : string | null = null;
    private currentTitle : string | null = null;
    private detections : {app:string, title : string, timestamp : string}[] = [];
    private intervalId: ReturnType<typeof setInterval> | null = null;

    start() : void{
        const poll = () => {
            try{
                const output = execSync('osascript -e tell application "System Events" to get {name, title} of first application process whose frontmost is true   ').toString().trim();
                const commaIndex = output.indexOf(', ');
                const app = output.slice(0, commaIndex);
                const title = output.slice(commaIndex+2);

                this.totalSamples++;
                this.currentApp = app;
                this.currentTitle = title;

                for (const window of aiWindows){
                    const lowerApp = app.toLowerCase();
                    const lowerTitle = title.toLowerCase();
                    if (lowerApp.includes(window) || lowerTitle.includes(window)){
                        this.detections.push({app,title,timestamp : new Date().toISOString()})
                    }
                }
            }catch{
                // do nothing
            }
        }

        poll();
        this.intervalId = setInterval(poll,5000)
    }

    stop() : void{
        if (this.intervalId){
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getData() : Record<string, unknown>{
        return {
            totalSamples : this.totalSamples,
            currentApp : this.currentApp,
            currentTitle : this.currentTitle,
            aiDetections : this.detections
        };
    }
}
