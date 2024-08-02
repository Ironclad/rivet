import { type DataValue } from '@ironclad/rivet-core';
import { LRUCache } from 'lru-cache';
import { match } from 'ts-pattern';

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
      .otherwise((v) => JSON.stringify(v).length);
  },
});

export function getGlobalDataRef(key: string): DataValue | undefined {
  return globalDataRefs.get(key);
}

export function setGlobalDataRef(key: string, value: DataValue): void {
  globalDataRefs.set(key, value);
}
