import { P, match } from 'ts-pattern';
import { useStableCallback } from './useStableCallback';
import {
  globalRivetNodeRegistry,
  type NodeId,
  type BuiltInNodes,
  type GraphId,
  type ChartNode,
} from '@ironclad/rivet-core';
import { useRecoilValue, useRecoilState, useSetRecoilState } from 'recoil';
import { type ContextMenuContext } from '../components/ContextMenu';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder';
import { projectState } from '../state/savedGraphs';
import { useCanvasPositioning } from './useCanvasPositioning';
import { useFactorIntoSubgraph } from './useFactorIntoSubgraph';
import { useGraphExecutor } from './useGraphExecutor';
import { useLoadGraph } from './useLoadGraph';
import { usePasteNodes } from './usePasteNodes';
import { connectionsState, nodesByIdState, nodesState } from '../state/graph';
import { useCopyNodes } from './useCopyNodes';
import { useDuplicateNode } from './useDuplicateNode';

export function useGraphBuilderContextMenuHandler() {
  const [nodes, setNodes] = useRecoilState(nodesState);
  const [connections, setConnections] = useRecoilState(connectionsState);
  const { clientToCanvasPosition } = useCanvasPositioning();
  const loadGraph = useLoadGraph();
  const project = useRecoilValue(projectState);
  const { tryRunGraph } = useGraphExecutor();
  const pasteNodes = usePasteNodes();
  const copyNodes = useCopyNodes();
  const duplicateNode = useDuplicateNode();
  const factorIntoSubgraph = useFactorIntoSubgraph();
  const setEditingNodeId = useSetRecoilState(editingNodeState);
  const [selectedNodeIds, setSelectedNodeIds] = useRecoilState(selectedNodesState);
  const nodesById = useRecoilValue(nodesByIdState);

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  const addNode = useStableCallback((nodeType: string, position: { x: number; y: number }) => {
    const newNode = globalRivetNodeRegistry.createDynamic(nodeType);

    newNode.visualData.x = position.x;
    newNode.visualData.y = position.y;

    // We've added more buttons at the top so just... increase the width of every node a little bit :/
    newNode.visualData.width = (newNode.visualData.width ?? 200) + 30;

    nodesChanged?.([...nodes, newNode]);
    // setSelectedNode(newNode.id);
  });

  const removeNodes = useStableCallback((...nodeIds: NodeId[]) => {
    const newNodes = [...nodes];
    let newConnections = [...connections];
    for (const nodeId of nodeIds) {
      const nodeIndex = newNodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex >= 0) {
        newNodes.splice(nodeIndex, 1);
      }

      // Remove all connections associated with the node
      newConnections = newConnections.filter((c) => c.inputNodeId !== nodeId && c.outputNodeId !== nodeId);
    }
    nodesChanged?.(newNodes);
    setConnections?.(newConnections);
  });

  return useStableCallback(
    (menuItemId: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => {
      match(menuItemId)
        .with(P.string.startsWith('add-node:'), () => {
          const nodeType = data as string;
          addNode(nodeType, clientToCanvasPosition(meta.x, meta.y));
        })
        .with('node-delete', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          const nodes = selectedNodeIds.length > 0 ? [...new Set([...selectedNodeIds, nodeId])] : [nodeId];

          removeNodes(...nodes);
          setSelectedNodeIds([]);
        })
        .with('paste', () => {
          pasteNodes(meta);
        })
        .with('node-edit', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          setEditingNodeId(nodeId);
        })
        .with('node-duplicate', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          duplicateNode(nodeId);
        })
        .with('nodes-factor-into-subgraph', () => {
          factorIntoSubgraph();
        })
        .with('node-go-to-subgraph', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          const node = nodesById[nodeId] as BuiltInNodes;

          if (node?.type !== 'subGraph') {
            return;
          }

          const { graphId } = node.data;

          const graph = project.graphs[graphId];

          if (!graph) {
            return;
          }

          loadGraph(graph);
        })
        .with(P.string.startsWith('go-to-graph:'), () => {
          const graphId = data as GraphId;
          const graph = project.graphs[graphId];
          if (graph) {
            loadGraph(graph);
          }
        })
        .with('node-run-to-here', () => {
          const { nodeId } = context.data as { nodeId: NodeId };

          tryRunGraph({ to: [nodeId] });
        })
        .with('node-copy', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          copyNodes(nodeId);
        })
        .otherwise(() => {
          console.log('Unknown menu item selected', menuItemId);
        });
    },
  );
}
