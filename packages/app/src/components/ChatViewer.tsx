import { FC, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { orderBy } from 'lodash-es';
import { overlayOpenState } from '../state/ui';
import { css } from '@emotion/react';
import clsx from 'clsx';
import {
  BuiltInNodes,
  ChartNode,
  DataValue,
  NodeId,
  PortId,
  ProcessId,
  ScalarOrArrayDataValue,
  arrayizeDataValue,
  coerceTypeOptional,
} from '@ironclad/rivet-core';
import { NodeRunData, lastRunDataByNodeState } from '../state/dataFlow';
import { projectState } from '../state/savedGraphs';
import { ErrorBoundary } from 'react-error-boundary';
import TextField from '@atlaskit/textfield';
import { useGoToNode } from '../hooks/useGoToNode';

export const ChatViewerRenderer: FC = () => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'chatViewer') return null;

  return (
    <ErrorBoundary fallback={null}>
      <ChatViewer onClose={() => setOpenOverlay(undefined)} />
    </ErrorBoundary>
  );
};

const styles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  z-index: 60;
  overflow: auto;

  .controls-filters {
    padding: 12px 16px;
    border-radius: 5px;
    background-color: var(--grey-darkish);
    display: flex;
    align-items: center;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    margin: 56px 48px 32px 48px;
  }

  .chats {
    padding: 0 48px;
    display: flex;
    flex-direction: column;
    gap: 32px;

    section {
      display: flex;
      flex-wrap: wrap;
      gap: 32px;
    }
  }

  .chat-bubble {
    width: 500px;

    border: 1px solid var(--primary);
    border-radius: 10px;
    box-shadow: 0 0 10px var(--shadow-primary-bright);

    &.complete {
      border: 1px solid var(--success);
      box-shadow: none;
    }

    &.error {
      border: 1px solid var(--error);
      box-shadow: none;
    }

    header {
      padding: 0 15px;
      background-color: var(--grey-darkish);
      border-radius: 10px 10px 0 0;
      border-bottom: 1px solid var(--grey-light);
      display: flex;
      align-items: center;
      justify-content: space-between;

      .graph-name {
        color: var(--primary-text);
      }

      .go-to-node {
        background-color: transparent;
        color: var(--foreground);
        border: 0;
        cursor: pointer;
        display: inline-block;
        height: 32px;
        padding: 0 15px;

        &:hover {
          color: var(--primary-text);
        }
      }
    }

    .line {
      border-top: 1px solid var(--grey-light);
    }

    .prompt {
      padding: 15px;
      white-space: pre-wrap;
      max-height: 100px;
      overflow: auto;
      color: var(--foreground-muted);
    }

    .response {
      padding: 15px;
      white-space: pre-wrap;
      height: 500px;
      overflow: auto;
    }

    &.complete .response {
      max-height: 200px;
    }
  }
`;

export const ChatViewer: FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const project = useRecoilValue(projectState);
  const allLastRunData = useRecoilValue(lastRunDataByNodeState);
  const [graphFilter, setGraphFilter] = useState('');
  const goToNode = useGoToNode();

  const nodesToGraphNameMap = useMemo(() => {
    const map: Record<NodeId, string> = {};
    Object.values(project.graphs).forEach((graph) => {
      graph.nodes.forEach((node) => {
        map[node.id] = graph.metadata?.name ?? 'Unknown Graph';
      });
    });
    return map;
  }, [project.graphs]);

  const chatNodes = useMemo(() => {
    const allNodes = Object.values(project.graphs).flatMap((g) => g.nodes) as BuiltInNodes[];
    const nodes = (allNodes as ChartNode[]).filter((node) => node.type === 'chat' || node.type === 'chatAnthropic');
    if (graphFilter === '') {
      return nodes;
    }

    return nodes.filter((node) => nodesToGraphNameMap[node.id]!.toLowerCase().includes(graphFilter.toLowerCase()));
  }, [project, graphFilter, nodesToGraphNameMap]);

  const processes = useMemo(() => {
    const nodesWithData = chatNodes.filter((node) => allLastRunData[node.id] != null);
    const processes = nodesWithData.flatMap((node) =>
      allLastRunData[node.id]!.map((data) => ({ node, process: data })),
    );

    return processes;
  }, [chatNodes, allLastRunData]);

  const processesWithIndex = useMemo(() => {
    return processes.flatMap((process) => {
      if (process.process.data.splitOutputData) {
        return Object.entries(process.process.data.splitOutputData).map(([index, data]) => {
          return { ...process, index: parseInt(index) };
        });
      }

      return [{ ...process, index: -1 }];
    });
  }, [processes]);

  const [runningProcesses, completedProcesses] = useMemo(() => {
    return [
      orderBy(
        processesWithIndex.filter(({ process }) => process.data.status?.type === 'running'),
        ({ process }) => process?.data.startedAt ?? 0,
        'desc',
      ),
      orderBy(
        processesWithIndex.filter(({ process }) => process.data.status?.type !== 'running'),
        ({ process }) => process?.data.finishedAt ?? 0,
        'desc',
      ),
    ];
  }, [processesWithIndex]);

  const doGoToNode = (nodeId: NodeId) => {
    goToNode(nodeId);
    onClose();
  };

  return (
    <div css={styles}>
      <div className="controls-filters">
        <TextField
          placeholder="Graph Filter..."
          value={graphFilter}
          onChange={(e) => setGraphFilter((e.target as HTMLInputElement).value)}
        />
      </div>
      <div className="chats">
        <section>
          {runningProcesses.map(({ node, process, index }) => {
            const graphName = nodesToGraphNameMap[node.id]!;
            return (
              <ChatBubble
                nodeId={node.id}
                processId={process.processId}
                data={process.data}
                key={`${node.id}-${process.processId}`}
                graphName={graphName}
                onGoToNode={doGoToNode}
                splitIndex={index}
              />
            );
          })}
        </section>
        <section>
          {completedProcesses.map(({ node, process, index }) => {
            const graphName = nodesToGraphNameMap[node.id]!;
            return (
              <ChatBubble
                nodeId={node.id}
                processId={process.processId}
                data={process.data}
                key={`${node.id}-${process.processId}`}
                graphName={graphName}
                onGoToNode={doGoToNode}
                splitIndex={index}
              />
            );
          })}
        </section>
      </div>
    </div>
  );
};

const ChatBubble: FC<{
  graphName: string;
  nodeId: NodeId;
  processId: ProcessId;
  data: NodeRunData;
  splitIndex: number;
  onGoToNode?: (nodeId: NodeId) => void;
}> = ({ nodeId, splitIndex, data, graphName, onGoToNode }) => {
  const promptRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  let prompt: DataValue;

  if (splitIndex === -1) {
    prompt = data.inputData?.['prompt' as PortId]!;
  } else {
    const values = arrayizeDataValue(data.inputData?.['prompt' as PortId] as ScalarOrArrayDataValue);
    if (values.length === 1) {
      prompt = values[0]!;
    } else {
      prompt = values[splitIndex]!;
    }
  }

  const chatOutput =
    splitIndex === -1
      ? data.outputData?.['response' as PortId]
      : data.splitOutputData![splitIndex]!['response' as PortId];

  const promptText = coerceTypeOptional(prompt, 'string');
  const responseText = coerceTypeOptional(chatOutput, 'string');

  useLayoutEffect(() => {
    if (promptRef.current) {
      promptRef.current.scrollTop = promptRef.current.scrollHeight;
    }
  }, [promptText]);

  useLayoutEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [responseText]);

  if (!chatOutput) {
    return null;
  }

  return (
    <div
      className={clsx('chat-bubble', {
        complete: data.status?.type === 'ok',
        error: data.status?.type === 'error',
      })}
    >
      <header>
        <span>
          In: <span className="graph-name">{graphName}</span>
        </span>
        <button className="go-to-node" onClick={() => onGoToNode?.(nodeId)}>
          Go To
        </button>
      </header>
      <div className="prompt" ref={promptRef}>
        {promptText}
      </div>
      <div className="line" />
      <div className="response" ref={responseRef}>
        {responseText}
      </div>
    </div>
  );
};
