/**
 * Browser stubs for tealtiger's provider-SDK imports.
 *
 * TODO(tealtiger): this shim (and the vite aliases in vite.config.ts) is a
 * temporary workaround. Upstream tealtiger will make its provider SDKs
 * (aws-sdk/bedrock, google-generative-ai, cohere-ai, mistral, openai, azure)
 * lazy/optional so deterministic guardrails (PII/secret) import cleanly in a
 * browser/ESM bundle — at which point this file and the aliases can be deleted
 * with just a dependency version bump. See TealTiger follow-up issues filed
 * from the governance-node PR review.
 *
 * tealtiger's ESM bundle statically imports its LLM provider SDKs
 * (@aws-sdk/client-bedrock-runtime, @google/generative-ai, openai, cohere-ai,
 * @mistralai/mistralai, axios) even though classes like TealBedrock are only
 * constructed lazily and the Rivet governance node never touches them. The AWS
 * and Google SDK trees drag Node-only builtins (streams, fs, net, tls) into the
 * browser bundle, so they are aliased to this stub in vite.config.ts. Named
 * imports must exist for rollup; constructing any of these classes in a browser
 * build throws.
 */

const unavailable = (name: string): never => {
  throw new Error(`${name} is not available in browser builds of Rivet (provider stub for tealtiger).`);
};

export class BedrockRuntimeClient {
  constructor() {
    unavailable('tealtiger TealBedrock (@aws-sdk/client-bedrock-runtime)');
  }
}

export class InvokeModelCommand {
  constructor() {
    unavailable('tealtiger TealBedrock InvokeModelCommand');
  }
}

export class InvokeModelWithResponseStreamCommand {
  constructor() {
    unavailable('tealtiger TealBedrock InvokeModelWithResponseStreamCommand');
  }
}

export class GoogleGenerativeAI {
  constructor() {
    unavailable('tealtiger TealGemini (@google/generative-ai)');
  }
}

export class CohereClient {
  constructor() {
    unavailable('tealtiger TealCohere (cohere-ai)');
  }
}

/**
 * ---- Node builtin shims (fs, fs/promises, crypto) ----
 *
 * Vite's default `__vite-browser-external` stub exports nothing, which breaks
 * rollup for tealtiger's named imports (`createHash` etc.). These shims resolve
 * those named imports:
 * - crypto hashing is implemented synchronously with crypto-js (already used by
 *   rivet-core), since Node's createHash API is synchronous.
 * - fs functions throw if actually called — tealtiger only uses them for
 *   policy-file watching, which the governance node does not use.
 */

import { SHA256, HmacSHA256, lib } from 'crypto-js';

const enc = (data: Uint8Array): lib.WordArray => {
  const words: number[] = [];
  for (let i = 0; i < data.length; i++) {
    words[i >>> 2] = (words[i >>> 2] ?? 0) | (data[i] << (24 - (i % 4) * 8));
  }
  return lib.WordArray.create(words, data.length);
};

class HashShim {
  private algo: 'sha256';
  private chunks: Uint8Array[] = [];

  constructor(algo: string) {
    if (algo !== 'sha256' && algo !== 'SHA256') {
      throw new Error(`nodeCryptoShim: unsupported hash algo '${algo}' (only sha256 is supported in the browser)`);
    }
    this.algo = 'sha256';
  }

  update(data: Uint8Array | string): this {
    if (typeof data === 'string') {
      this.chunks.push(new TextEncoder().encode(data));
    } else {
      this.chunks.push(data);
    }
    return this;
  }

  digest(encoding?: string): string | Uint8Array {
    const total = this.chunks.reduce((n, c) => n + c.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of this.chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    const wordArray = enc(merged);
    const hash = this.algo === 'sha256' ? SHA256(wordArray) : SHA256(wordArray);
    if (encoding === 'hex' || encoding === undefined) {
      return hash.toString();
    }
    // base64 / others: return raw bytes
    return new Uint8Array(lib.WordArray.create(hash.words, 32).words.flatMap((w) => [
      (w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff,
    ]));
  }
}

export function createHash(algo: string): HashShim {
  return new HashShim(algo);
}

export function createHmac(algo: string, key: Uint8Array | string): { update(d: Uint8Array | string): { digest(enc?: string): string | Uint8Array } } {
  if (algo !== 'sha256' && algo !== 'SHA256') {
    throw new Error(`nodeCryptoShim: unsupported hmac algo '${algo}' (only sha256 is supported in the browser)`);
  }
  let chunks: Uint8Array[] = [];
  const keyWords = typeof key === 'string' ? enc(new TextEncoder().encode(key)) : enc(key);
  return {
    update(d: Uint8Array | string) {
      chunks.push(typeof d === 'string' ? new TextEncoder().encode(d) : d);
      return this;
    },
    digest(enc2?: string) {
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      const mac = HmacSHA256(enc(merged), keyWords);
      if (enc2 === 'hex' || enc2 === undefined) {
        return mac.toString();
      }
      return new Uint8Array(mac.words.flatMap((w) => [
        (w >>> 24) & 0xff, (w >>> 16) & 0xff, (w >>> 8) & 0xff, w & 0xff,
      ]));
    },
  };
}

export function randomUUID(): string {
  // Web Crypto is available in all modern browsers (and workers)
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

// ---- fs shims: tealtiger only uses these for policy-file watching, which the
// browser governance node never touches. Fail loudly if someone does. ----

export async function readFile(_path: string, _enc?: string): Promise<never> {
  throw new Error('fs.readFile is not available in the browser (tealtiger policy-file reading is unsupported here)');
}

export function watch(_path: string, _listener?: (...args: unknown[]) => void): { close(): void } {
  throw new Error('fs.watch is not available in the browser (tealtiger policy-file watching is unsupported here)');
  // eslint-disable-next-line no-unreachable
  return { close() { /* unreachable */ } };
}

// Namespace-style access: `import { promises as fs } from 'node:fs'` (used by
// @aws-sdk packages and similar). Every method throws if actually called.
export const promises = {
  readFile: () => {
    throw new Error('fs.promises.* is not available in the browser');
  },
  writeFile: () => {
    throw new Error('fs.promises.* is not available in the browser');
  },
  stat: () => {
    throw new Error('fs.promises.* is not available in the browser');
  },
};

// Safety net for other crypto names referenced by node-targeted packages that
// may end up in the graph; browser code paths must never reach them.
export const createPrivateKey = (): never => {
  throw new Error('crypto.createPrivateKey is not available in the browser');
};
export const createPublicKey = (): never => {
  throw new Error('crypto.createPublicKey is not available in the browser');
};
export const sign = (): never => {
  throw new Error('crypto.sign is not available in the browser');
};
export const verify = (): never => {
  throw new Error('crypto.verify is not available in the browser');
};
export const createSign = (): never => {
  throw new Error('crypto.createSign is not available in the browser');
};
export const createVerify = (): never => {
  throw new Error('crypto.createVerify is not available in the browser');
};