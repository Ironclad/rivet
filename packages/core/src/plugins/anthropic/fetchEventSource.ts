// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285
export class EventSourceResponse extends Response {
  name: string;
  readonly streams: {
    eventStream: ReadableStream<string>;
    textStream: ReadableStream<string>;
  } | null;

  constructor(body: ReadableStream<Uint8Array> | null, init?: ResponseInit) {
    if (body == null) {
      super(null, init);
      this.name = 'EventSourceResponse';
      this.streams = null;
      return;
    }

    const [bodyForString, bodyForEvents] = body.tee();
    const streams = createEventStream(bodyForEvents);
    // By passing our transformed stream into the Response constructor, we prevent anyone
    // from accidentally accessing the raw response.body stream.
    super(bodyForString, init);
    this.name = 'EventSourceResponse';
    this.streams = streams;
  }

  async *events(): AsyncGenerator<string> {
    if (this.streams == null) {
      return;
    }
    const reader = this.streams.eventStream.getReader();

    try {
      while (true) {
        const { done, value } = await this.raceWithTimeout(reader.read());
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async raceWithTimeout<T>(promise: Promise<T>, timeout = 5000): Promise<T> {
    // eslint-disable-next-line no-async-promise-executor -- Error handled correctly
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout: API response took too long.'));
      }, timeout);

      try {
        const result = await promise;
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
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

class LineSplitter implements Transformer<string, string> {
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
}

function createEventStream(body: ReadableStream<Uint8Array> | null) {
  if (body == null) {
    return null;
  }

  const textStream = body.pipeThrough(new TextDecoderStream());

  const eventStream = textStream.pipeThrough(new TransformStream(new LineSplitter())).pipeThrough(
    new TransformStream<string, string>({
      transform(line, controller) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          controller.enqueue(data);
        } else if (line.startsWith('event: ')) {
          const event = line.slice(7).trim();
          controller.enqueue(`[${event}]`);
        }
      },
    }),
  );
  return { eventStream, textStream };
}
