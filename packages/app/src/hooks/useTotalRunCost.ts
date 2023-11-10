import {
  type NodeId,
  type ChartNode,
  type BuiltInNodeType,
  type PortId,
  type GraphId,
  type NodeGraph,
} from '@ironclad/rivet-core';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { lastRunDataByNodeState } from '../state/dataFlow';
import { graphState } from '../state/graph';
import { projectState } from '../state/savedGraphs';
import { entries } from '../../../core/src/utils/typeSafety';

export function useTotalRunCost() {
  const lastRunData = useRecoilValue(lastRunDataByNodeState);
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);

  const allNodesById = useMemo(() => {
    if (!project) {
      return {};
    }

    const combinedGraphs: Record<GraphId, NodeGraph> = { ...project.graphs, [graph.metadata!.id!]: graph };
    const allNodes = entries(combinedGraphs).flatMap(([graphId, projectGraph]) => {
      if (projectGraph.metadata!.id! === graph.metadata!.id!) {
        return graph.nodes.map((node) => {
          return { graphId, nodeId: node.id, node };
        });
      }
      return projectGraph.nodes.map((node) => {
        return { graphId, nodeId: node.id, node };
      });
    });

    return Object.fromEntries(allNodes.map((node) => [node.nodeId, node.node])) as Record<NodeId, ChartNode>;
  }, [project, graph]); // TODO this is a lot of calc on every node change

  const totals = useMemo(() => {
    if (!lastRunData) {
      return { cost: 0, tokens: 0 };
    }

    let totalCost = 0;
    let totalTokens = 0;

    for (const [nodeId, nodeLastRunData] of entries(lastRunData)) {
      const node = allNodesById[nodeId];

      if (!node) {
        continue;
      }

      if ((node.type as BuiltInNodeType) === 'subGraph') {
        // Cost is aggregated for subgraphs, but we're aggregating manually here
        continue;
      }

      // Optimization for now
      if ((node.type as BuiltInNodeType) !== 'chat') {
        continue;
      }

      const cost = nodeLastRunData.reduce((acc, curr) => {
        if (curr.data.status?.type !== 'ok') {
          return acc;
        }

        const outputData = curr.data.outputData;

        if (!outputData) {
          return acc;
        }

        const outputCost = outputData['cost' as PortId];
        if (outputCost?.type === 'number[]') {
          return outputCost.value.reduce((acc, curr) => acc + curr, 0);
        } else if (outputCost?.type === 'number') {
          return (outputCost.value as number) + acc;
        }
        return acc;
      }, 0);

      const tokens = nodeLastRunData.reduce((acc, curr) => {
        if (curr.data.status?.type !== 'ok') {
          return acc;
        }

        const outputData = curr.data.outputData;

        if (!outputData) {
          return acc;
        }

        const tokens = outputData['__hidden_token_count' as PortId];
        if (tokens?.type === 'number[]') {
          return tokens.value.reduce((acc, curr) => acc + curr, 0);
        } else if (tokens?.type === 'number') {
          return (tokens.value as number) + acc;
        }
        return acc;
      }, 0);

      if (cost) {
        totalCost += cost;
      }

      if (tokens) {
        totalTokens += tokens;
      }
    }

    return { cost: totalCost, tokens: totalTokens };
  }, [lastRunData, allNodesById]);

  return totals;
}
