interface TrackerInterface {
    readonly name : string;
    start() : void;
    stop() : void;
    getData() : Record<string, unknown>;
}
