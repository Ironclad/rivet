export interface SimplifiedRequest {
  url: string;
  method?: string;
  body?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface SimplifiedResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  body: T;
  headers: Record<string, string>;
}

export interface SimplifiedStreamingEvent {
  type: string;
  data: string;
}

export interface HttpProvider {
  supportsStreaming: boolean;

  fetch<Res = unknown, Req = unknown>(request: SimplifiedRequest): Promise<SimplifiedResponse<Res>>;

  streamEvents<Req = unknown>(request: SimplifiedRequest): AsyncGenerator<SimplifiedStreamingEvent>;
}

export class FakeHttpProvider implements HttpProvider {
  supportsStreaming = false;

  async fetch<Res = unknown, Req = unknown>(request: SimplifiedRequest): Promise<SimplifiedResponse<Res>> {
    throw new Error('FakeHttpProvider does not support fetch');
  }

  async *streamEvents<Req = unknown>(request: SimplifiedRequest): AsyncGenerator<SimplifiedStreamingEvent> {
    throw new Error('FakeHttpProvider does not support streamEvents');
  }
}
