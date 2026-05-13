import { TrackerInterface } from './base.js';

export class WindowWatcher implements TrackerInterface{
    readonly name = "open windows";

    start() : void{

    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {};
    }
}
