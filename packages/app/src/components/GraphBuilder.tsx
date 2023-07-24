import { FC, useEffect, useMemo, useState } from 'react';
import { NodeCanvas } from './NodeCanvas.js';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsState, nodesByIdState } from '../state/graph.js';
import { nodesState } from '../state/graph.js';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder.js';
import { NodeEditorRenderer } from './NodeEditor.js';
import styled from '@emotion/styled';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import {
  ArrayDataValue,
  ChartNode,
  GraphId,
  NodeId,
  NodeType,
  Nodes,
  StringDataValue,
  nodeFactory,
} from '@ironclad/rivet-core';
import { ProcessQuestions, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput.js';
import { entries } from '../utils/typeSafety.js';
import { UserInputModal } from './UserInputModal.js';
import Button from '@atlaskit/button';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { useFactorIntoSubgraph } from '../hooks/useFactorIntoSubgraph.js';
import { ErrorBoundary } from 'react-error-boundary';
import { loadedRecordingState } from '../state/execution.js';
import { useLoadGraph } from '../hooks/useLoadGraph.js';
import { projectState } from '../state/savedGraphs.js';
import { ContextMenuContext } from './ContextMenu.js';

const Container = styled.div`
  position: relative;

  .user-input-modal-open {
    position: absolute;
    top: 48px;
    right: 0;
    z-index: 100;
  }

  .recording-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 100;
    box-shadow: inset 0 0 2px 3px var(--warning-dark);
  }
`;

export const GraphBuilder: FC = () => {
  const [nodes, setNodes] = useRecoilState(nodesState);
  const [connections, setConnections] = useRecoilState(connectionsState);
  const [selectedNodeIds, setSelectedNodeIds] = useRecoilState(selectedNodesState);
  const { clientToCanvasPosition } = useCanvasPositioning();
  const setEditingNodeId = useSetRecoilState(editingNodeState);
  const loadedRecording = useRecoilValue(loadedRecordingState);
  const loadGraph = useLoadGraph();
  const project = useRecoilValue(projectState);

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  const addNode = useStableCallback((nodeType: NodeType, position: { x: number; y: number }) => {
    const newNode = nodeFactory(nodeType);

    newNode.visualData.x = position.x;
    newNode.visualData.y = position.y;

    nodesChanged?.([...nodes, newNode]);
    // setSelectedNode(newNode.id);
  });

  const removeNode = useStableCallback((nodeId: NodeId) => {
    const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
    if (nodeIndex >= 0) {
      const newNodes = [...nodes];
      newNodes.splice(nodeIndex, 1);
      nodesChanged?.(newNodes);
    }

    // Remove all connections associated with the node
    const newConnections = connections.filter((c) => c.inputNodeId !== nodeId && c.outputNodeId !== nodeId);
    setConnections?.(newConnections);
  });

  const factorIntoSubgraph = useFactorIntoSubgraph();
  const nodesById = useRecoilValue(nodesByIdState);

  const contextMenuItemSelected = useStableCallback(
    (menuItemId: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => {
      if (menuItemId.startsWith('add-node:')) {
        const nodeType = data as NodeType;
        addNode(nodeType, clientToCanvasPosition(meta.x, meta.y));
        return;
      }

      if (menuItemId === 'node-delete') {
        const { nodeId } = context.data as { nodeId: NodeId };
        removeNode(nodeId);
        return;
      }

      if (menuItemId === 'node-edit') {
        const { nodeId } = context.data as { nodeId: NodeId };
        setEditingNodeId(nodeId);
        return;
      }

      if (menuItemId === 'node-duplicate') {
        const { nodeId } = context.data as { nodeId: NodeId };
        const node = nodesById[nodeId] as Nodes;

        if (!node) {
          return;
        }

        const newNode = nodeFactory(node.type);
        newNode.data = { ...(node.data as object) };
        newNode.visualData = {
          ...node.visualData,
          x: node.visualData.x,
          y: node.visualData.y + 200,
        };
        newNode.title = node.title;
        newNode.description = node.description;
        newNode.isSplitRun = node.isSplitRun;
        newNode.splitRunMax = node.splitRunMax;
        nodesChanged?.([...nodes, newNode]);

        // Copy the connections to the input ports
        const oldNodeConnections = connections.filter((c) => c.inputNodeId === nodeId);
        const newNodeConnections = oldNodeConnections.map((c) => ({
          ...c,
          inputNodeId: newNode.id,
        }));
        setConnections([...connections, ...newNodeConnections]);
      }

      if (menuItemId === 'nodes-factor-into-subgraph') {
        factorIntoSubgraph();
      }

      if (menuItemId === 'node-go-to-subgraph') {
        const { nodeId } = context.data as { nodeId: NodeId };
        const node = nodesById[nodeId] as Nodes;

        if (node?.type !== 'subGraph') {
          return;
        }

        const { graphId } = node.data;

        const graph = project.graphs[graphId];

        if (!graph) {
          return;
        }

        loadGraph(graph);
      }

      if (menuItemId.startsWith('go-to-graph:')) {
        const graphId = data as GraphId;
        const graph = project.graphs[graphId];
        if (graph) {
          loadGraph(graph);
        }
      }
    },
  );

  const nodeSelected = useStableCallback((node: ChartNode, multi: boolean) => {
    if (!multi) {
      return; // Can only "select" a node if you're holding shift, for now
    }
    setSelectedNodeIds((nodeIds) => [...new Set([...nodeIds, node.id])]);
  });

  const nodeStartEditing = useStableCallback((node: ChartNode) => {
    setEditingNodeId(node.id);
  });

  const allCurrentQuestions = useRecoilValue(userInputModalQuestionsState);
  const userInputModalSubmit = useRecoilValue(userInputModalSubmitState);
  const firstNodeQuestions = useMemo(() => entries(allCurrentQuestions)[0], [allCurrentQuestions]);

  const [isUserInputModalOpen, setUserInputModalOpen] = useState(false);

  const handleCloseUserInputModal = () => {
    setUserInputModalOpen(false);
  };

  const handleOpenUserInputModal = () => {
    setUserInputModalOpen(true);
  };

  const handleSubmitUserInputModal = (answers: ArrayDataValue<StringDataValue>) => {
    // Handle the submission of the user input
    setUserInputModalOpen(false);
    userInputModalSubmit.submit(firstNodeQuestions![0], answers);
  };

  useEffect(() => {
    if (firstNodeQuestions && firstNodeQuestions.length > 0) {
      setUserInputModalOpen(true);
    }
  }, [firstNodeQuestions]);

  const [, questions] = firstNodeQuestions ? firstNodeQuestions : [undefined, [] as ProcessQuestions[]];
  const lastQuestions = questions.at(-1)?.questions ?? [];

  const selectedNodes = useMemo(
    () => selectedNodeIds.map((nodeId) => nodesById[nodeId]).filter(isNotNull),
    [selectedNodeIds, nodesById],
  );

  return (
    <Container>
      <ErrorBoundary fallback={<div>Failed to render GraphBuilder</div>}>
        <NodeCanvas
          nodes={nodes}
          connections={connections}
          onNodesChanged={nodesChanged}
          onConnectionsChanged={setConnections}
          onNodeSelected={nodeSelected}
          selectedNodes={selectedNodes}
          onNodeStartEditing={nodeStartEditing}
          onContextMenuItemSelected={contextMenuItemSelected}
        />
        {loadedRecording && <div className="recording-border" />}
        <NodeEditorRenderer />
        {firstNodeQuestions && firstNodeQuestions.length > 0 && (
          <Button onClick={handleOpenUserInputModal} className="user-input-modal-open" appearance="primary">
            User Input Needed
          </Button>
        )}
        <UserInputModal
          open={isUserInputModalOpen}
          questions={lastQuestions}
          onSubmit={handleSubmitUserInputModal}
          onClose={handleCloseUserInputModal}
        />
      </ErrorBoundary>
    </Container>
  );
};
