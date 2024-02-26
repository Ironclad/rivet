import { type NodeId } from '@ironclad/rivet-core';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { nodesState } from '../state/graph';

const GARBAGE_COLLECTION_INTERVAL = 100;

export interface HeightCache {
  get: (nodeId: NodeId) => number | undefined;

  has: (nodeId: NodeId) => boolean;

  set: (nodeId: NodeId, height: number | undefined) => void;
}

/**
 * A cache of node heights. This is used when a node is unmounted and moved to the dragging list, since the node's
 * body needs to be re-rendered in order to get its height. This cache allows us to avoid flickering when the node
 * is first rendered in the dragging list.
 */
export const useNodeHeightCache = (): HeightCache => {
  const nodes = useRecoilValue(nodesState);

  const ref = useRef<Record<string, number | undefined>>({});
  const garbageCollectionCount = useRef(0);

  const set = useCallback((nodeId: NodeId, height: number | undefined) => {
    ref.current[nodeId] = height;
  }, []);

  const get = useCallback((nodeId: NodeId) => {
    return ref.current[nodeId];
  }, []);

  const has = useCallback((nodeId: NodeId) => {
    return nodeId in ref.current;
  }, []);

  /**
   * This hook removes nodes from the cache that have been deleted. To improve performance, we only clean up
   * the cache for every X nodes that are deleted (cache is just numbers).
   */
  useEffect(() => {
    if (garbageCollectionCount.current++ % GARBAGE_COLLECTION_INTERVAL !== 0) {
      ref.current = nodes.reduce(
        (acc, next) => {
          acc[next.id] = ref.current[next.id];
          return acc;
        },
        {} as Record<string, number | undefined>,
      );
    }
  }, [nodes]);

  return useMemo(() => {
    return { set, get, has } satisfies HeightCache;
  }, [set, get, has]);
};

/**
 * This hook persist the last known height of a node's body to the height cache, and can later use that last known
 * height temporarily while the node is waiting for the body to be available.
 */
export const useNodeBodyHeight = (heightCache: HeightCache, nodeId: NodeId, ready: boolean) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready) {
      heightCache.set(nodeId, ref.current?.getBoundingClientRect().height);
    }
  }, [heightCache, nodeId, ready]);

  return { ref, height: !ready && heightCache.has(nodeId) ? `${heightCache.get(nodeId)}px` : undefined };
};
