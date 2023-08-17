// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285
export class EventSourceResponse extends Response {
  name: string;
  readonly eventStream: ReadableStream<string> | null;

  constructor(body: ReadableStream<Uint8Array> | null, init?: ResponseInit) {
    const eventStream = createEventStream(body);
    // By passing our transformed stream into the Response constructor, we prevent anyone
    // from accidentally accessing the raw response.body stream.
    super(eventStream, init);
    this.name = 'EventSourceResponse';
    this.eventStream = eventStream;
  }

  async *events(): AsyncGenerator<string> {
    if (this.eventStream == null) {
      return;
    }
    const reader = this.eventStream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (err) {
        console.error(`Failed to release lock on readable stream!`);
      }
    }
  }
}

export default async function fetchEventSource(url: string, init?: RequestInit): Promise<EventSourceResponse> {
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

const lineSplitter = new (class implements Transformer<string, string> {
  private buffer = '';
  constructor(readonly separator = /\n+/) {}

  transform(chunk: string, controller: TransformStreamDefaultController<string>): void {
    this.buffer += chunk;
    const lines = this.buffer.split(this.separator);
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      controller.enqueue(line);
    }
  }

  flush(controller: TransformStreamDefaultController<string>): void {
    if (this.buffer.length > 0) {
      controller.enqueue(this.buffer);
      this.buffer = '';
    }
  }
})();

function createEventStream(body: ReadableStream<Uint8Array> | null): ReadableStream<string> | null {
  if (body == null) {
    return null;
  }

  const textStream = body.pipeThrough(new TextDecoderStream());

  const eventStream = textStream.pipeThrough(new TransformStream(lineSplitter)).pipeThrough(
    new TransformStream<string, string>({
      transform(line, controller) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          controller.enqueue(data);
        }
      },
    }),
  );
  return eventStream;
}
