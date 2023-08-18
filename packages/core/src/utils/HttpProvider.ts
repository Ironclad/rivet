// Simplified version of the Request interface
interface SimplifiedRequest<T> {
  url: string;
  method?: string;
  body?: T;
  headers?: Record<string, string>;
}

// Simplified version of the Response interface
interface SimplifiedResponse<T> {
  ok: boolean;
  status: number;
  statusText: string;
  body: T;
  headers: Record<string, string>;
}

// Event interface
interface SimplifiedEvent<T> {
  type: string;
  data: T;
}

// HttpProvider interface
interface HttpProvider {
  fetch<Res = unknown, Req = unknown>(request: SimplifiedRequest<Req>): Promise<SimplifiedResponse<Res>>;
  streamEvents<Res = unknown, Req = unknown>(request: SimplifiedRequest<Req>): AsyncGenerator<SimplifiedEvent<Req>>;
}
