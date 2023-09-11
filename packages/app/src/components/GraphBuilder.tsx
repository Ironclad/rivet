import { FC, useEffect, useMemo, useState, MouseEvent } from 'react';
import { NodeCanvas } from './NodeCanvas.js';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsState, graphState, nodesByIdState } from '../state/graph.js';
import { nodesState } from '../state/graph.js';
import { editingNodeState, graphNavigationStackState, selectedNodesState } from '../state/graphBuilder.js';
import { NodeEditorRenderer } from './NodeEditor.js';
import styled from '@emotion/styled';
import { useCanvasPositioning } from '../hooks/useCanvasPositioning.js';
import { useStableCallback } from '../hooks/useStableCallback.js';
import {
  ArrayDataValue,
  BuiltInNodes,
  ChartNode,
  GraphId,
  NodeId,
  StringDataValue,
  globalRivetNodeRegistry,
} from '@ironclad/rivet-core';
import { ProcessQuestions, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput.js';
import { UserInputModal } from './UserInputModal.js';
import Button from '@atlaskit/button';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { useFactorIntoSubgraph } from '../hooks/useFactorIntoSubgraph.js';
import { ErrorBoundary } from 'react-error-boundary';
import { loadedRecordingState } from '../state/execution.js';
import { useLoadGraph } from '../hooks/useLoadGraph.js';
import { projectState } from '../state/savedGraphs.js';
import { ContextMenuContext } from './ContextMenu.js';
import { useGraphHistoryNavigation } from '../hooks/useGraphHistoryNavigation';
import { useProjectPlugins } from '../hooks/useProjectPlugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { useCurrentExecution } from '../hooks/useCurrentExecution';
import { useGraphExecutor } from '../hooks/useGraphExecutor';

const Container = styled.div`
  position: relative;

  .user-input-modal-open {
    position: absolute;
    top: 62px;
    right: 16px;
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
  const [graphNavigationStack, setGraphNavigationStack] = useRecoilState(graphNavigationStackState);
  const historyNav = useGraphHistoryNavigation();
  useProjectPlugins();
  const { tryRunGraph } = useGraphExecutor();

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  const addNode = useStableCallback((nodeType: string, position: { x: number; y: number }) => {
    const newNode = globalRivetNodeRegistry.createDynamic(nodeType);

    newNode.visualData.x = position.x;
    newNode.visualData.y = position.y;

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

  const factorIntoSubgraph = useFactorIntoSubgraph();
  const nodesById = useRecoilValue(nodesByIdState);

  const contextMenuItemSelected = useStableCallback(
    (menuItemId: string, data: unknown, context: ContextMenuContext, meta: { x: number; y: number }) => {
      if (menuItemId.startsWith('add-node:')) {
        const nodeType = data as string;
        addNode(nodeType, clientToCanvasPosition(meta.x, meta.y));
        return;
      }

      if (menuItemId === 'node-delete') {
        if (selectedNodeIds.length === 0) {
          const { nodeId } = context.data as { nodeId: NodeId };
          removeNodes(nodeId);
        } else {
          removeNodes(...selectedNodeIds);
        }
        return;
      }

      if (menuItemId === 'node-edit') {
        const { nodeId } = context.data as { nodeId: NodeId };
        setEditingNodeId(nodeId);
        return;
      }

      if (menuItemId === 'node-duplicate') {
        const { nodeId } = context.data as { nodeId: NodeId };
        const node = nodesById[nodeId];

        if (!node) {
          return;
        }

        const newNode = globalRivetNodeRegistry.createDynamic(node.type);
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
      }

      if (menuItemId.startsWith('go-to-graph:')) {
        const graphId = data as GraphId;
        const graph = project.graphs[graphId];
        if (graph) {
          loadGraph(graph);
        }
      }

      if (menuItemId === 'node-run-to-here') {
        const { nodeId } = context.data as { nodeId: NodeId };

        tryRunGraph({ to: [nodeId] });
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

  const containerMouseDown = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    if (e.buttons === 8) {
      e.preventDefault();
      // Mouse Back
      historyNav.navigateBack();
    } else if (e.buttons === 16) {
      e.preventDefault();
      // Mouse Forward
      historyNav.navigateForward();
    }
  });

  const [, questions] = firstNodeQuestions ? firstNodeQuestions : [undefined, [] as ProcessQuestions[]];
  const lastQuestions = questions.at(-1)?.questions ?? [];

  const selectedNodes = useMemo(
    () => selectedNodeIds.map((nodeId) => nodesById[nodeId]).filter(isNotNull),
    [selectedNodeIds, nodesById],
  );

  return (
    <Container onMouseDown={containerMouseDown}>
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
