import { FC, useEffect, useMemo, useState } from 'react';
import { NodeCanvas } from './NodeCanvas';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsState, nodesByIdState } from '../state/graph';
import { nodesState } from '../state/graph';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder';
import { NodeEditorRenderer } from './NodeEditor';
import styled from '@emotion/styled';
import { ContextMenuData } from '../hooks/useContextMenu';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useStableCallback } from '../hooks/useStableCallback';
import { ArrayDataValue, ChartNode, NodeId, NodeType, Nodes, StringDataValue, nodeFactory } from '@ironclad/rivet-core';
import { ProcessQuestions, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { entries } from '../utils/typeSafety';
import { UserInputModal } from './UserInputModal';
import Button from '@atlaskit/button';
import { isNotNull } from '../utils/genericUtilFunctions';
import { useFactorIntoSubgraph } from '../hooks/useFactorIntoSubgraph';
import { ErrorBoundary } from 'react-error-boundary';
import { loadedRecordingState } from '../state/execution';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { projectState } from '../state/savedGraphs';

const Container = styled.div`
  position: relative;

  .user-input-modal-open {
    position: absolute;
    top: 48px;
    right: 0;
    z-index: 100;
  }

  .recording-border {
    border: 3px solid var(--warning-dark);
    position: absolute;
    top: 32px;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
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

  const contextMenuItemSelected = useStableCallback((menuItemId: string, contextMenuData: ContextMenuData) => {
    if (menuItemId.startsWith('Add:')) {
      const nodeType = menuItemId.substring(4) as NodeType;
      addNode(nodeType, clientToCanvasPosition(contextMenuData.x, contextMenuData.y));
      return;
    }

    if (menuItemId.startsWith('Delete:')) {
      const nodeId = menuItemId.substring(7) as NodeId;
      removeNode(nodeId);
      return;
    }

    if (menuItemId.startsWith('Edit:')) {
      const nodeId = menuItemId.substring(5) as NodeId;
      setSelectedNodeIds([nodeId]);
      return;
    }

    if (menuItemId.startsWith('Duplicate:')) {
      const nodeId = menuItemId.substring(10) as NodeId;
      const node = nodesById[nodeId] as Nodes;

      if (!node) {
        return;
      }

      const newNode = nodeFactory(node.type);
      newNode.data = { ...node.data };
      newNode.visualData = {
        ...node.visualData,
        x: node.visualData.x,
        y: node.visualData.y + 100,
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

    if (menuItemId.startsWith('FactorIntoSubgraph')) {
      factorIntoSubgraph();
    }

    if (menuItemId.startsWith('GoToSubgraph:')) {
      const nodeId = menuItemId.substring(13) as NodeId;
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
  });

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
