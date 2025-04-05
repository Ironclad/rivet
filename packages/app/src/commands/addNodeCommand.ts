import { useSetAtom } from 'jotai';
import { useCommand } from './Command';
import { nodesState } from '../state/graph';
import {
  globalRivetNodeRegistry,
  type GraphId,
  type ProjectId,
  type ReferencedGraphAliasNode,
  type NodeId,
} from '@ironclad/rivet-core';

export function useAddNodeCommand() {
  const setNodes = useSetAtom(nodesState);

  return useCommand<{ nodeType: string; position: { x: number; y: number } }, { id: NodeId }>({
    type: 'addNode',
    apply(params, appliedData, currentState) {
      let nodeType = params.nodeType as string | undefined;
      let referencedProjectId: string | undefined;
      let referencedGraphId: string | undefined;

      if (nodeType?.startsWith('referencedGraphAlias')) {
        [nodeType, referencedProjectId, referencedGraphId] = nodeType.split(':');
      }

      if (!nodeType) {
        throw new Error('Node type is required');
      }

      const newNode = globalRivetNodeRegistry.createDynamic(nodeType);

      newNode.visualData.x = params.position.x;
      newNode.visualData.y = params.position.y;

      if (appliedData) {
        newNode.id = appliedData.id;
      }

      // We've added more buttons at the top so just... increase the width of every node a little bit :/
      newNode.visualData.width = (newNode.visualData.width ?? 200) + 30;

      // Special graph reference node
      if (newNode.type === 'referencedGraphAlias') {
        if (!referencedProjectId || !referencedGraphId) {
          throw new Error('Referenced graph alias node requires project and graph IDs');
        }

        const data = newNode.data as ReferencedGraphAliasNode['data'];
        data.projectId = referencedProjectId as ProjectId;
        data.graphId = referencedGraphId as GraphId;

        const graphName = currentState.referencedProjects[data.projectId]?.graphs[data.graphId]?.metadata?.name;
        newNode.title = graphName ?? 'Unknown Graph';
      }

      setNodes([...currentState.nodes, newNode]);

      return { id: newNode.id };
    },
    undo(_data, { id }) {
      setNodes((allNodes) => allNodes.filter((node) => node.id !== id));
    },
  });
}
