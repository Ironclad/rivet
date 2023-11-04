import { type FC, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { NodeCanvas } from './NodeCanvas.js';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { connectionsState, nodesByIdState, nodesState } from '../state/graph.js';
import { editingNodeState, selectedNodesState } from '../state/graphBuilder.js';
import { NodeEditorRenderer } from './NodeEditor.js';
import styled from '@emotion/styled';
import { useStableCallback } from '../hooks/useStableCallback.js';
import { type ArrayDataValue, type ChartNode, type StringDataValue } from '@ironclad/rivet-core';
import { type ProcessQuestions, userInputModalQuestionsState, userInputModalSubmitState } from '../state/userInput.js';
import { UserInputModal } from './UserInputModal.js';
import Button from '@atlaskit/button';
import { isNotNull } from '../utils/genericUtilFunctions.js';
import { ErrorBoundary } from 'react-error-boundary';
import { loadedRecordingState } from '../state/execution.js';
import { useGraphHistoryNavigation } from '../hooks/useGraphHistoryNavigation';
import { useProjectPlugins } from '../hooks/useProjectPlugins';
import { entries } from '../../../core/src/utils/typeSafety';
import { useGraphBuilderContextMenuHandler } from '../hooks/useGraphBuilderContextMenuHandler';
import { NavigationBar } from './NavigationBar';
import { projectState } from '../state/savedGraphs';
import { useDatasets } from '../hooks/useDatasets';
import { overlayOpenState } from '../state/ui';
import { GraphExecutionSelectorBar } from './GraphExecutionSelectorBar';

const Container = styled.div`
  position: relative;

  .user-input-modal-open {
    position: absolute;
    top: calc(62px + var(--project-selector-height));
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
  const setEditingNodeId = useSetRecoilState(editingNodeState);
  const loadedRecording = useRecoilValue(loadedRecordingState);
  const project = useRecoilValue(projectState);

  useDatasets(project.metadata.id);

  const historyNav = useGraphHistoryNavigation();
  useProjectPlugins();

  const nodesChanged = useStableCallback((newNodes: ChartNode[]) => {
    setNodes?.(newNodes);
  });

  const nodesById = useRecoilValue(nodesByIdState);
  const contextMenuHandler = useGraphBuilderContextMenuHandler();

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

  const [questionsNodeId, questions] = firstNodeQuestions ? firstNodeQuestions : [undefined, [] as ProcessQuestions[]];
  const lastQuestions = questions.at(-1)?.questions ?? [];

  const selectedNodes = useMemo(
    () => selectedNodeIds.map((nodeId) => nodesById[nodeId]).filter(isNotNull),
    [selectedNodeIds, nodesById],
  );

  const overlay = useRecoilValue(overlayOpenState);

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
          onContextMenuItemSelected={contextMenuHandler}
        />
        {loadedRecording && <div className="recording-border" />}
        <NodeEditorRenderer />
        {firstNodeQuestions && firstNodeQuestions.length > 0 && (
          <Button onClick={handleOpenUserInputModal} className="user-input-modal-open" appearance="primary">
            User Input Needed
          </Button>
        )}
        {overlay === undefined && <NavigationBar />}
        <GraphExecutionSelectorBar />
        <UserInputModal
          open={isUserInputModalOpen}
          questions={lastQuestions}
          questionsNodeId={questionsNodeId}
          onSubmit={handleSubmitUserInputModal}
          onClose={handleCloseUserInputModal}
        />
      </ErrorBoundary>
    </Container>
  );
};
