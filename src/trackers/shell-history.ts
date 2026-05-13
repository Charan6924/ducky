import { TrackerInterface } from './base.js';

export class ShellHistoryWatcher implements TrackerInterface{
    readonly name = "shell history";

    start() : void{

    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {};
    }
}
