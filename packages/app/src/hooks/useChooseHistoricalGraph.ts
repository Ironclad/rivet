import { type GraphId, type NodeGraph } from '@ironclad/rivet-core';
import { type CalculatedRevision } from '../utils/ProjectRevisionCalculator';
import { useSetAtom } from 'jotai';
import { graphState, historicalGraphState, isReadOnlyGraphState } from '../state/graph';

export function useChooseHistoricalGraph(revision: CalculatedRevision) {
  const setGraph = useSetAtom(graphState);
  const setIsReadOnlyGraph = useSetAtom(isReadOnlyGraphState);
  const setHistoricalGraph = useSetAtom(historicalGraphState);

  return (graphId: GraphId) => {
    const nodesBefore = revision.projectAtRevision!.graphs[graphId]?.nodes ?? [];
    const nodesAfter = revision.projectAtRevision!.graphs[graphId]?.nodes!;

    const nodesDeleted = nodesAfter?.filter((node) => !nodesBefore?.some((n) => n.id === node.id));

    const combinedGraph: NodeGraph = {
      ...revision.projectAtRevision!.graphs[graphId]!,
      nodes: [...nodesAfter, ...nodesDeleted],
    };

    setGraph(combinedGraph);
    setIsReadOnlyGraph(true);
    setHistoricalGraph(revision);
  };
}
