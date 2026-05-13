import { TrackerInterface } from './base.js';

export class GitLogWatcher implements TrackerInterface{
    readonly name = "git logs";

    start() : void{

    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {};
    }
}
