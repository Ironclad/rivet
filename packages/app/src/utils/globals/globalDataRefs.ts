import { type ChatMessage, type DataValue } from '@ironclad/rivet-core';
import { LRUCache } from 'lru-cache';
import { P, match } from 'ts-pattern';

const globalDataRefs = new LRUCache<string, DataValue>({
  maxSize: 500 * 1024 * 1024, // 500MB
  sizeCalculation: (value) => {
    return match(value)
      .with({ type: 'image' }, (v) => v.value.data.byteLength)
      .with({ type: 'binary' }, (v) => v.value.byteLength)
      .with({ type: 'audio' }, (v) => v.value.data.byteLength)
      .with({ type: 'image[]' }, (v) => v.value.reduce((acc, img) => acc + img.data.byteLength, 0))
      .with({ type: 'binary[]' }, (v) => v.value.reduce((acc, bin) => acc + bin.byteLength, 0))
      .with({ type: 'audio[]' }, (v) => v.value.reduce((acc, audio) => acc + audio.data.byteLength, 0))
      .with({ type: 'document' }, (v) => v.value.data.byteLength)
      .with({ type: 'document[]' }, (v) => v.value.reduce((acc, doc) => acc + doc.data.byteLength, 0))
      .with({ type: 'chat-message' }, (v) => getSizeOfChatMessage(v.value))
      .with({ type: 'chat-message[]' }, (v) => v.value.reduce((acc, msg) => acc + getSizeOfChatMessage(msg), 0))
      .otherwise((v) => JSON.stringify(v).length);
  },
});

export function getGlobalDataRef(key: string): DataValue | undefined {
  return globalDataRefs.get(key);
}

export function setGlobalDataRef(key: string, value: DataValue): void {
  globalDataRefs.set(key, value);
}

function getSizeOfChatMessage(value: ChatMessage): any {
  const parts = Array.isArray(value.message) ? value.message : [value.message];

  const size = parts.reduce(
    (acc, part) =>
      match(part)
        .with(P.string, (p) => (acc as number) + p.length)
        .with({ type: 'document' }, (p) => acc + p.data.byteLength)
        .with({ type: 'image' }, (p) => acc + p.data.byteLength)
        .with({ type: 'url' }, (p) => acc + p.url.length)
        .exhaustive(),
    0,
  );

  return size > 0 ? size : 1; // Empty chat message should still take up some "space"
}
