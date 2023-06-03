import { FC, useEffect, useMemo, useState } from 'react';
import { NodeCanvas } from './NodeCanvas';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsSelector } from '../state/graph';
import { nodesSelector } from '../state/graph';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder';
import { NodeEditorRenderer } from './NodeEditor';
import styled from '@emotion/styled';
import { ContextMenuData } from '../hooks/useContextMenu';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning';
import { useStableCallback } from '../hooks/useStableCallback';
import { ArrayDataValue, ChartNode, NodeId, NodeType, Nodes, StringDataValue, nodeFactory } from '@ironclad/nodai-core';
import { ProcessQuestions, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput';
import { entries } from '../utils/typeSafety';
import { UserInputModal } from './UserInputModal';
import Button from '@atlaskit/button';
import { isNotNull } from '../utils/genericUtilFunctions';

const Container = styled.div`
  position: relative;

  .user-input-modal-open {
    position: absolute;
    top: 48px;
    right: 0;
    z-index: 100;
  }
`;

export const GraphBuilder: FC = () => {
  const [nodes, setNodes] = useRecoilState(nodesSelector);
  const [connections, setConnections] = useRecoilState(connectionsSelector);
  const [selectedNodeIds, setSelectedNodeIds] = useRecoilState(selectedNodesState);
  const { clientToCanvasPosition } = useCanvasPositioning();
  const setEditingNodeId = useSetRecoilState(editingNodeState);

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
      const node = nodes.find((n) => n.id === nodeId) as Nodes;

      if (!node) {
        return;
      }

      const newNode = nodeFactory(node.type);
      newNode.data = { ...node.data };
      newNode.visualData = {
        ...node.visualData,
        x: node.visualData.x + 20,
        y: node.visualData.y + 20,
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
    () => selectedNodeIds.map((nodeId) => nodes.find((n) => n.id === nodeId)).filter(isNotNull),
    [nodes, selectedNodeIds],
  );

  console.dir({ questions, lastQuestions, firstNodeQuestions, allCurrentQuestions });

  return (
    <Container>
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
    </Container>
  );
};
