export interface SessionMetaData{
    startTime : string;
    endTime : string;
    durationsMs : number;
    projectDir : string;
}

export interface DuckyReport{
    metadata : SessionMetaData;
    tracking : Record<string, unknown>;
}


