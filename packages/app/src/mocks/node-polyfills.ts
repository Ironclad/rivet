// Mock implementation for node:child_process
export const spawn = () => {
  throw new Error('child_process.spawn is not supported in browser environment');
};

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
  // Add other fs methods as needed
};

export const path = {
  join: (...paths: string[]) => paths.join('/'),
  resolve: (...paths: string[]) => paths.join('/'),
  dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
  // Add other path methods as needed
};

export const os = {
  platform: () => 'browser',
  homedir: () => '/',
  // Add other os methods as needed
};

export const stream = {
  Readable: class {
    pipe() { return this; }
  },
  Writable: class {},
  Transform: class {},
  // Add other stream classes as needed
};

export const util = {
  promisify: (fn: Function) => fn,
  // Add other util methods as needed
};

export const events = {
  EventEmitter: class {
    on() {}
    emit() {}
    // Add other EventEmitter methods as needed
  },
};

export const buffer = {
  Buffer: {
    from: () => new Uint8Array(),
    // Add other Buffer methods as needed
  },
};

export const crypto = {
  randomBytes: () => new Uint8Array(),
  createHash: () => ({
    update: () => ({
      digest: () => '',
    }),
  }),
  // Add other crypto methods as needed
};

// Export other Node.js module mocks as needed
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
  // Add other net methods as needed
};

export const tls = {
  connect: () => {
    throw new Error('tls.connect is not supported in browser environment');
  },
};

export const assert = {
  ok: () => {},
  // Add other assert methods as needed
}; 