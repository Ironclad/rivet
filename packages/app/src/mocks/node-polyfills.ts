
const process = {
  env: {},
  platform: 'browser',
  cwd: () => '/',
  versions: {
    node: '0.0.0',
  },
};

export default process;

export const fs = {
  readFileSync: () => {
    throw new Error('fs.readFileSync is not supported in browser environment');
  },
  writeFileSync: () => {
    throw new Error('fs.writeFileSync is not supported in browser environment');
  },
};

export const path = {
  join: (...paths: string[]) => paths.join('/'),
  resolve: (...paths: string[]) => paths.join('/'),
  dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
};

export const os = {
  platform: () => 'browser',
  homedir: () => '/',
};

export const stream = {
  Readable: class {
    pipe() { return this; }
  },
  Writable: class {},
  Transform: class {},
};

export const util = {
  promisify: (fn: Function) => fn,
};

export const events = {
  EventEmitter: class {
    on() {}
    emit() {}
  },
};

export const buffer = {
  Buffer: {
    from: () => new Uint8Array(),
  },
};

export const crypto = {
  randomBytes: () => new Uint8Array(),
  createHash: () => ({
    update: () => ({
      digest: () => '',
    }),
  }),
};

export const querystring = {
  stringify: (obj: any) => new URLSearchParams(obj).toString(),
  parse: (str: string) => Object.fromEntries(new URLSearchParams(str)),
};

export const url = {
  parse: (urlStr: string) => new URL(urlStr),
  resolve: (from: string, to: string) => new URL(to, from).toString(),
};

export const http = {
  request: () => {
    throw new Error('http.request is not supported in browser environment');
  },
};

export const https = {
  request: () => {
    throw new Error('https.request is not supported in browser environment');
  },
};

export const net = {
  Socket: class {},
};

export const tls = {
  connect: () => {
    throw new Error('tls.connect is not supported in browser environment');
  },
};

export const assert = {
  ok: () => {},
};
