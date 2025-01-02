import { type ChartNode, type NodeId } from '@ironclad/rivet-core';
import { useAtomValue } from 'jotai';
import { graphState, historicalGraphState } from '../state/graph';
import isEqual from 'fast-deep-equal';

export type HistoricalNodeChangeInfo =
  | {
      changed: false;
    }
  | {
      changed: true;
      before: ChartNode | undefined;
      after: ChartNode | undefined;
    };

export function useHistoricalNodeChangeInfo(nodeId: NodeId): HistoricalNodeChangeInfo | undefined {
  const historicalGraph = useAtomValue(historicalGraphState);
  const graph = useAtomValue(graphState);

  if (historicalGraph == null) {
    return undefined;
  }

  const beforeGraph = historicalGraph.projectBeforeRevision?.graphs[graph.metadata!.id!];
  const afterGraph = historicalGraph.projectAtRevision?.graphs[graph.metadata!.id!];

  if (!beforeGraph) {
    const nodeData = graph.nodes.find((node) => node.id === nodeId);

    return { changed: true, before: undefined, after: nodeData };
  }

  if (!afterGraph) {
    const nodeData = graph.nodes.find((node) => node.id === nodeId);

    // Shouldn't actually happen
    return { changed: true, before: nodeData, after: undefined };
  }

  const beforeNode = beforeGraph.nodes.find((node) => node.id === nodeId);
  const afterNode = afterGraph.nodes.find((node) => node.id === nodeId);

  if (!beforeNode && !afterNode) {
    return { changed: false };
  }

  if (!beforeNode) {
    return { changed: true, before: undefined, after: afterNode };
  }

  if (!afterNode) {
    return { changed: true, before: beforeNode, after: undefined };
  }

  if (isEqual(beforeNode, afterNode)) {
    return { changed: false };
  }

  return { changed: true, before: beforeNode, after: afterNode };
}
