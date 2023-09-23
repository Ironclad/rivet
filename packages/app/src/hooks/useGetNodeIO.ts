import { useRecoilValue } from 'recoil';
import { ioDefinitionsForNodeState } from '../state/graph.js';
import { type NodeId } from '@ironclad/rivet-core';

export function useNodeIO(nodeId: NodeId | undefined) {
  return useRecoilValue(ioDefinitionsForNodeState(nodeId));
}
