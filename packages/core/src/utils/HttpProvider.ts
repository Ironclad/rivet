export interface SimplifiedRequest<T> {
  url: string;
  method?: string;
  body?: T;
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

  fetch<Res = unknown, Req = unknown>(request: SimplifiedRequest<Req>): Promise<SimplifiedResponse<Res>>;

  streamEvents<Req = unknown>(request: SimplifiedRequest<Req>): AsyncGenerator<SimplifiedStreamingEvent>;
}
