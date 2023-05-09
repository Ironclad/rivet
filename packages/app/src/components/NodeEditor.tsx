import { FC, useCallback, useEffect } from 'react';
import { selectedNodeState } from '../state/graphBuilder';
import { useRecoilState, useRecoilValue } from 'recoil';
import { nodesSelector } from '../state/graph';
import styled from '@emotion/styled';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { NodeType, Nodes, nodeDisplayName, ChartNode } from '@ironclad/nodai-core';
import { match } from 'ts-pattern';
import { PromptNodeEditor } from './nodes/PromptNode';
import produce from 'immer';
import { ChatNodeEditor } from './nodes/ChatNode';
import { TextNodeEditor } from './nodes/TextNode';
import { ExtractRegexNodeEditor } from './nodes/ExtractRegexNode';
import { CodeNodeEditor } from './nodes/CodeNode';
import { MatchNodeEditor } from './nodes/MatchNode';
import { UserInputNodeEditor } from './nodes/UserInputNode';
import { IfNodeEditor } from './nodes/IfNode';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { ReadDirectoryNodeEditor } from './nodes/ReadDirectoryNode';
import { ReadFileNodeEditor } from './nodes/ReadFileNode';
import Toggle from '@atlaskit/toggle';
import { IfElseNodeEditor } from './nodes/IfElseNode';
import { ChunkNodeEditor } from './nodes/ChunkNode';
import { GraphInputNodeEditor } from './nodes/GraphInputNode';
import { GraphOutputNodeEditor } from './nodes/GraphOutputNode';
import { SubGraphNodeEditor } from './nodes/SubGraphNode';

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

  const selectedNode = nodes.find((node) => node.id === selectedNodeId)!;

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

  const nodeEditor = match(selectedNode as Nodes)
    .with({ type: 'prompt' }, (node) => <PromptNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'chat' }, (node) => <ChatNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'text' }, (node) => <TextNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'extractRegex' }, (node) => (
      <ExtractRegexNodeEditor node={node} onChange={(node) => updateNode(node)} />
    ))
    .with({ type: 'code' }, (node) => <CodeNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'match' }, (node) => <MatchNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'userInput' }, (node) => <UserInputNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'if' }, (node) => <IfNodeEditor />)
    .with({ type: 'ifElse' }, (node) => <IfElseNodeEditor node={node} />)
    .with({ type: 'readDirectory' }, (node) => (
      <ReadDirectoryNodeEditor node={node} onChange={(node) => updateNode(node)} />
    ))
    .with({ type: 'readFile' }, (node) => <ReadFileNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'chunk' }, (node) => <ChunkNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'graphInput' }, (node) => <GraphInputNodeEditor node={node} onChange={(node) => updateNode(node)} />)
    .with({ type: 'graphOutput' }, (node) => (
      <GraphOutputNodeEditor node={node} onChange={(node) => updateNode(node)} />
    ))
    .with({ type: 'subGraph' }, (node) => <SubGraphNodeEditor node={node} onChange={(node) => updateNode(node)} />)
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
        <InlineEditableTextfield
          defaultValue={selectedNode.description ?? ''}
          onConfirm={nodeDescriptionChanged}
          placeholder="Enter any description or notes for this node..."
        ></InlineEditableTextfield>
      </div>
      <section>
        <h3 className="section-title">Split</h3>
        <Toggle
          isChecked={selectedNode.isSplitRun}
          onChange={(isSplitRun) => updateNode({ ...selectedNode, isSplitRun: isSplitRun.target.checked })}
          label="Split"
        />
        <input
          type="number"
          className="input-field split-max"
          placeholder="Max"
          value={selectedNode.splitRunMax ?? 10}
          onChange={(event) => updateNode({ ...selectedNode, splitRunMax: event.target.valueAsNumber })}
        />
      </section>
      {nodeEditor && (
        <div className="section section-node">
          <h3 className="section-title">{nodeDisplayName[selectedNode.type as NodeType]}</h3>
          <div className="section-node-content">{nodeEditor}</div>
        </div>
      )}
    </Container>
  );
};
