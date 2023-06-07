export declare class EventSourceResponse extends Response {
    name: string;
    readonly streams: {
        eventStream: ReadableStream<string>;
        textStream: ReadableStream<string>;
    } | null;
    constructor(body: ReadableStream<Uint8Array> | null, init?: ResponseInit);
    events(): AsyncGenerator<string>;
    private raceWithTimeout;
}
export default function fetchEventSource(url: string, init?: RequestInit): Promise<EventSourceResponse>;
