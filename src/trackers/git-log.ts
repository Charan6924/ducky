import { TrackerInterface } from './base.js';
import { execSync } from 'child_process';

export class GitLogWatcher implements TrackerInterface{
    readonly name = "git logs";
    private commits: { hash: string; message: string; aiAttributed: boolean; date: string }[] = [];
    private totalCommits = 0;
    private aiAttributed = 0;
    private burstsDetected = 0;

    start() : void{
        try{
            const projectDir = process.cwd();
            const log = execSync('git log -30 --format="%H%n%ai%n%s%n%B%x00"', { cwd: projectDir }).toString();

            const commits: { hash: string; message: string; aiAttributed: boolean; date: string }[] = [];

            for (const record of log.split('\0').filter(r => r.trim())) {
                const lines = record.split('\n');
                const hash = lines[0] || '';
                const date = lines[1] || '';
                const subject = lines[2] || '';
                const body = lines.slice(3).join('\n');
                const message = subject + '\n' + body;
                const aiAttributed = message.includes('Co-Authored-By')

                commits.push({ hash, message, aiAttributed, date });
            }

            this.commits = commits;
            this.totalCommits = commits.length;
            this.aiAttributed = commits.filter(c => c.aiAttributed).length;

            // burst detection
            let bursts = 0;
            for (let i = 0; i < commits.length - 2; i++) {
                const t1 = new Date(commits[i].date).getTime();
                const t3 = new Date(commits[i + 2].date).getTime();
                if (t1 - t3 < 60000) bursts++;
            }
            this.burstsDetected = bursts;
        } catch{
            // not a git repo track nothing
        }
        
    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {
            totalCommits: this.totalCommits,
            aiAttributed: this.aiAttributed,
            burstsDetected: this.burstsDetected,
            commits: this.commits,
        };
    }
}

