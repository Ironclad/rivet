import { FC, useCallback, useEffect } from 'react';
import { selectedNodeState } from '../state/graphBuilder';
import { useRecoilState, useRecoilValue } from 'recoil';
import { nodesSelector } from '../state/graph';
import { ChartNode } from '../model/NodeBase';
import styled from '@emotion/styled';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { NodeType, nodeDisplayName } from '../model/Nodes';
import { match } from 'ts-pattern';
import { PromptNodeEditor } from './nodes/PromptNode';
import produce from 'immer';
import { InlineEditableTextArea } from './InlineEditableTextArea';
import { ChatNodeEditor } from './nodes/ChatNode';
import { lastRunDataByNodeState } from '../state/dataFlow';
import { TextNodeEditor } from './nodes/TextNode';
import { ExtractRegexNodeEditor } from './nodes/ExtractRegexNode';
import { CodeNodeEditor } from './nodes/CodeNode';
import { MatchNodeEditor } from './nodes/MatchNode';
import { UserInputNodeEditor } from './nodes/UserInputNode';

export const NodeEditorRenderer: FC = () => {
  const nodes = useRecoilValue(nodesSelector);
  const selectedNodeId = useRecoilValue(selectedNodeState);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNodeId || !selectedNode) {
    return null;
  }

  return <NodeEditor selectedNode={selectedNode} />;
};

type NodeEditorProps = { selectedNode: ChartNode };

const Container = styled.div`
  position: absolute;
  top: 32px;
  right: 0;
  bottom: 0;
  width: 45%;
  min-width: 500px;
  max-width: 1000px;
  padding: 20px;
  background-color: var(--grey-darker);
  border-left: 2px solid var(--grey);
  color: var(--body-text);
  font-family: 'Roboto Mono', monospace;
  display: flex;
  flex-direction: column;
  gap: 20px;
  color: var(--foreground);
  overflow: auto;

  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    margin: 0;
  }

  h3 {
    font-size: 20px;
    margin: 0;
  }

  .close-button {
    position: absolute;
    right: 20px;
    top: 20px;
    background-color: var(--primary);
    border: none;
    color: var(--grey-dark);
    cursor: pointer;
    font-size: 20px;
    padding: 5px 10px;
    border: 2px solid var(--grey-dark);
    font-size: 14px;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .section-title {
    color: var(--foreground-bright);
    font-size: 20px;
    margin-bottom: 10px;
  }

  .node-name {
    padding: 5px 10px;
    resize: none;
    width: 100%;
  }

  .description-field {
    min-height: 50px;
    padding: 10px;
    width: 100%;
  }

  .input-field {
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    background-color: var(--grey-dark);
    border: 1px solid var(--grey);
    color: var(--foreground);
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary);
  }

  .section-node {
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .section-node-content {
    flex-grow: 1;
    position: relative;
    display: flex;
  }

  .unknown-node {
    color: var(--primary);
  }
`;

export const NodeEditor: FC<NodeEditorProps> = () => {
  const [nodes, setNodes] = useRecoilState(nodesSelector);
  const [selectedNodeId, setSelectedNodeId] = useRecoilState(selectedNodeState)!;
  const allLastData = useRecoilValue(lastRunDataByNodeState);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)!;
  const lastData = allLastData[selectedNode.id];

  const updateNode = useCallback(
    (node: ChartNode) => {
      setNodes((nodes) =>
        produce(nodes, (draft) => {
          const index = draft.findIndex((n) => n.id === node.id);
          draft[index] = node;
        }),
      );
    },
    [setNodes],
  );

  const nodeEditor = match(selectedNode)
    .with({ type: 'prompt' }, (node) => <PromptNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'chat' }, (node) => <ChatNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'text' }, (node) => <TextNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'extractRegex' }, (node) => (
      <ExtractRegexNodeEditor node={node} onChange={(node) => updateNode(node)} />
    ))
    .with({ type: 'code' }, (node) => <CodeNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'match' }, (node) => <MatchNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .otherwise(() => null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedNodeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedNodeId]);

  const nodeDescriptionChanged = useCallback(
    (description: string) => {
      updateNode({ ...selectedNode, description });
    },
    [selectedNode, updateNode],
  );

  const nodeTitleChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateNode({ ...selectedNode, title: event.target.value });
    },
    [selectedNode, updateNode],
  );

  return (
    <Container>
      <button className="close-button" onClick={() => setSelectedNodeId(null)}>
        <MultiplyIcon />
      </button>
      <div className="section">
        <h3 className="section-title">Node Info</h3>
        <input
          type="text"
          className="node-name input-field"
          placeholder="Enter a name for the node..."
          value={selectedNode.title}
          onChange={nodeTitleChanged}
        />
      </div>
      <div className="section">
        <InlineEditableTextArea
          value={selectedNode.description ?? ''}
          onChange={nodeDescriptionChanged}
          placeholder="Enter any description or notes for this node..."
        ></InlineEditableTextArea>
      </div>
      {nodeEditor && (
        <div className="section section-node">
          <h3 className="section-title">{nodeDisplayName[selectedNode.type as NodeType]}</h3>
          <div className="section-node-content">{nodeEditor}</div>
        </div>
      )}
      {lastData && (
        <section className="section section-last-data">
          <h3 className="section-title">Last Data</h3>

          {lastData.status?.status === 'error' && (
            <div className="section-last-data-content">
              <h4>Error</h4>
              <p>{lastData.status.error}</p>
            </div>
          )}
          <div className="section-last-data-content">
            {lastData?.inputData && (
              <>
                <h4>Inputs</h4>
                <dl>
                  {Object.entries(lastData?.inputData ?? {}).map(([key, value]) => {
                    return (
                      <>
                        <dt key={`${key}-key`}>{key}</dt>
                        <dd key={`${key}-value`}>{JSON.stringify(value, null, 2)}</dd>
                      </>
                    );
                  })}
                </dl>
              </>
            )}
            {lastData?.outputData && (
              <>
                <h4>Outputs</h4>
                <dl>
                  {Object.entries(lastData?.outputData ?? {}).map(([key, value]) => {
                    return (
                      <>
                        <dt>{key}</dt>
                        <dd>{JSON.stringify(value, null, 2)}</dd>
                      </>
                    );
                  })}
                </dl>
              </>
            )}
          </div>
        </section>
      )}
    </Container>
  );
};
