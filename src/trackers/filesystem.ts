import { TrackerInterface } from './base.js';

export class FilesystemWatcher implements TrackerInterface{
    readonly name = "file systems";

    start() : void{

    }

    stop() : void{

    }

    getData() : Record<string, unknown>{
        return {};
    }
}
