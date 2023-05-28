// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285
export class EventSourceResponse extends Response {
    name;
    eventStream;
    constructor(body, init) {
        const eventStream = createEventStream(body);
        // By passing our transformed stream into the Response constructor, we prevent anyone
        // from accidentally accessing the raw response.body stream.
        super(eventStream, init);
        this.name = 'EventSourceResponse';
        this.eventStream = eventStream;
    }
    async *events() {
        if (this.eventStream == null) {
            return;
        }
        const reader = this.eventStream.getReader();
        try {
            while (true) {
                const { done, value } = await this.raceWithTimeout(reader.read());
                if (done) {
                    break;
                }
                yield value;
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    async raceWithTimeout(promise, timeout = 5000) {
        return new Promise(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Timeout: API response took too long.'));
            }, timeout);
            try {
                const result = await promise;
                clearTimeout(timer);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timer);
                reject(error);
            }
        });
    }
}
export default async function fetchEventSource(url, init) {
    const headers = {
        ...init?.headers,
        accept: 'text/event-stream',
    };
    const response = await fetch(url, {
        ...init,
        headers,
    });
    return new EventSourceResponse(response.body, response);
}
const lineSplitter = new (class {
    separator;
    buffer = '';
    constructor(separator = /\n+/) {
        this.separator = separator;
    }
    transform(chunk, controller) {
        this.buffer += chunk;
        const lines = this.buffer.split(this.separator);
        this.buffer = lines.pop() ?? '';
        for (const line of lines) {
            controller.enqueue(line);
        }
    }
    flush(controller) {
        if (this.buffer.length > 0) {
            controller.enqueue(this.buffer);
            this.buffer = '';
        }
    }
})();
function createEventStream(body) {
    if (body == null) {
        return null;
    }
    const textStream = body.pipeThrough(new TextDecoderStream());
    const eventStream = textStream.pipeThrough(new TransformStream(lineSplitter)).pipeThrough(new TransformStream({
        transform(line, controller) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                controller.enqueue(data);
            }
        },
    }));
    return eventStream;
}
