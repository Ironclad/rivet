import { P, match } from 'ts-pattern';
import { useStableCallback } from './useStableCallback';
import { type NodeId, type BuiltInNodes, type GraphId } from '@ironclad/rivet-core';
import { type ContextMenuContext } from '../components/ContextMenu';
import { editingNodeState } from '../state/graphBuilder';
import { projectState } from '../state/savedGraphs';
import { useCanvasPositioning } from './useCanvasPositioning';
import { useFactorIntoSubgraph } from './useFactorIntoSubgraph';
import { useGraphExecutor } from './useGraphExecutor';
import { useLoadGraph } from './useLoadGraph';
import { usePasteNodes } from './usePasteNodes';
import { nodesByIdState } from '../state/graph';
import { useCopyNodes } from './useCopyNodes';
import { useDuplicateNode } from './useDuplicateNode';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAddNodeCommand } from '../commands/addNodeCommand';
import { useDeleteNodesCommand } from '../commands/deleteNodeCommand';
import { useAutoLayoutGraph } from './useAutoLayoutGraph';

export function useGraphBuilderContextMenuHandler({ onAutoLayoutGraph }: { onAutoLayoutGraph: () => void }) {
  const { clientToCanvasPosition } = useCanvasPositioning();
  const loadGraph = useLoadGraph();
  const project = useAtomValue(projectState);
  const { tryRunGraph } = useGraphExecutor();
  const pasteNodes = usePasteNodes();
  const copyNodes = useCopyNodes();
  const duplicateNode = useDuplicateNode();
  const factorIntoSubgraph = useFactorIntoSubgraph();
  const setEditingNodeId = useSetAtom(editingNodeState);
  const nodesById = useAtomValue(nodesByIdState);
  const removeNodes = useDeleteNodesCommand();

  const addNode = useAddNodeCommand();

  return useStableCallback(
    (menuItemId: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => {
      match(menuItemId)
        .with(P.string.startsWith('add-node:'), () => {
          const nodeType = data as string;
          addNode({
            nodeType,
            position: clientToCanvasPosition(meta.x, meta.y),
          });
        })
        .with('node-delete', () => {
          const { nodeId } = context.data as { nodeId: NodeId };
          removeNodes({ nodeIds: [nodeId] });
        })
        .with('paste', () => {
          pasteNodes(meta);
        })
        .with('auto-layout', () => {
          onAutoLayoutGraph();
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
        .with('node-run-from-here', () => {
          const { nodeId } = context.data as { nodeId: NodeId };

          tryRunGraph({ from: nodeId });
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
