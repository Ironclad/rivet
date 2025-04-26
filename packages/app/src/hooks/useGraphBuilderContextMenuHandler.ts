import { P, match } from 'ts-pattern';
import { useStableCallback } from './useStableCallback';
import { type NodeId, type BuiltInNodes, type GraphId, type SubGraphNode } from '@ironclad/rivet-core';
import { type ContextMenuContext } from '../components/ContextMenu';
import { editingNodeState } from '../state/graphBuilder';
import { projectState } from '../state/savedGraphs';
import { useCanvasPositioning } from './useCanvasPositioning';
import { useFactorIntoSubgraph } from './useFactorIntoSubgraph';
import { useGraphExecutor } from './useGraphExecutor';
import { useLoadGraph } from './useLoadGraph';
import { usePasteNodes } from './usePasteNodes';
import { connectionsState, graphMetadataState, nodesByIdState } from '../state/graph';
import { useCopyNodes } from './useCopyNodes';
import { useDuplicateNode } from './useDuplicateNode';
import { useAtomValue, useSetAtom } from 'jotai';
import { useAddNodeCommand } from '../commands/addNodeCommand';
import { useDeleteNodesCommand } from '../commands/deleteNodeCommand';
import { copyToClipboard } from '../utils/copyToClipboard';
import { toast } from 'react-toastify';
import { type GraphWithName, type NodeWithName, ToastDeleteNodeConfirm } from '../components/ToastDeleteNodeConfirm';



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
  const connections = useAtomValue(connectionsState);
  const graph = useAtomValue(graphMetadataState) as GraphWithName;

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
          const { nodeId: toDeleteNodeId } = context.data as { nodeId: NodeId };
          const node = nodesById[toDeleteNodeId] as BuiltInNodes;
          const nodeIdGraphIdMap = new Map<NodeWithName, GraphWithName>();

          // if the node to be deleted is an "graph input / output" node then
          // check subgraphs in other graphs in the project
          if (node?.type === 'graphInput' || node?.type === 'graphOutput') {
            // find all the subgraphs in the project pointing to that graph
            Object.values(project.graphs).filter(g => g.metadata?.id !== graph.id).forEach(g => {
              g.nodes.filter(n => n.type === "subGraph").forEach((node) => {
                const subGraphNode = node as SubGraphNode;
                if (subGraphNode.data.graphId === graph.id) {
                  const connectedNode = {
                    nodeId: subGraphNode.id,
                    name: subGraphNode.title,
                  };
                  const connectedNodeGraph = {
                    id: g.metadata?.id as GraphId,
                    name: g.metadata?.name ?? ""
                  };
                  nodeIdGraphIdMap.set(connectedNode, connectedNodeGraph);
                }
              });
            });
          }

          if (nodeIdGraphIdMap.size > 0) {
            toast.warn(ToastDeleteNodeConfirm({
              nodeGraphMap: nodeIdGraphIdMap,
              onDelete: () => { removeNodes({ nodeIds: [toDeleteNodeId] }); },
            }, {
              pauseOnHover: true,
              width: 400,
             }));
          } else {
            removeNodes({ nodeIds: [toDeleteNodeId] });
          }
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
