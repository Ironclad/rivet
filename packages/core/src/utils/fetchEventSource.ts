import { getError } from './errors.js';
import { DEFAULT_CHAT_NODE_TIMEOUT } from './defaults.js';

// https://github.com/openai/openai-node/issues/18#issuecomment-1518715285
export class EventSourceResponse extends Response {
  name: string;
  timeout?: number;
  readonly streams: {
    eventStream: ReadableStream<string>;
    textStream: ReadableStream<string>;
  } | null;

  constructor(body: ReadableStream<Uint8Array> | null, init?: ResponseInit, timeout?: number) {
    if (body == null) {
      super(null, init);
      this.name = 'EventSourceResponse';
      this.streams = null;
      this.timeout = timeout;
      return;
    }

    const [bodyForString, bodyForEvents] = body.tee();
    const streams = createEventStream(bodyForEvents);
    // By passing our transformed stream into the Response constructor, we prevent anyone
    // from accidentally accessing the raw response.body stream.
    super(bodyForString, init);
    this.name = 'EventSourceResponse';
    this.streams = streams;
    this.timeout = timeout;
  }

  async *events(): AsyncGenerator<string> {
    if (this.streams == null) {
      return;
    }
    const reader = this.streams.eventStream.getReader();

    try {
      while (true) {
        const { done, value } = await this.raceWithTimeout(reader.read(), this.timeout);
        if (done) {
          break;
        }
        yield value;
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (err) {
        console.error(`Failed to release read lock on event source: ${getError(err).toString()}`);
      }
    }
  }

  private async raceWithTimeout<T>(promise: Promise<T>, timeout?: number): Promise<T> {
    const raceTimeout = timeout ?? DEFAULT_CHAT_NODE_TIMEOUT;

    // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises -- Error handled correctly
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout: API response took too long.'));
      }, raceTimeout);

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

export default async function fetchEventSource(
  url: string,
  init?: RequestInit,
  timeout?: number,
): Promise<EventSourceResponse> {
  const headers = {
    ...init?.headers,
    accept: 'text/event-stream',
  };

  const response = await fetch(url, {
    ...init,
    headers,
  });

  return new EventSourceResponse(response.body, response, timeout);
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
        if (line.trim().length === 0) {
          return;
        }

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
