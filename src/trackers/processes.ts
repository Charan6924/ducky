import { TrackerInterface } from './base.js';

export class ProcessWatcher implements TrackerInterface{
    readonly name = "processes";

    start() : void{

    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {};
    }
}
