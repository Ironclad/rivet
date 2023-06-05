import { FC, useEffect } from 'react';
import { editingNodeState } from '../state/graphBuilder';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { nodesSelector } from '../state/graph';
import styled from '@emotion/styled';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { NodeType, getNodeDisplayName, ChartNode } from '@ironclad/nodai-core';
import { useUnknownNodeComponentDescriptorFor } from '../hooks/useNodeTypes';
import produce from 'immer';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import Toggle from '@atlaskit/toggle';
import { useStableCallback } from '../hooks/useStableCallback';

export const NodeEditorRenderer: FC = () => {
  const nodes = useRecoilValue(nodesSelector);
  const [editingNodeId, setEditingNodeId] = useRecoilState(editingNodeState);

  const deselect = useStableCallback(() => {
    setEditingNodeId(null);
  });

  const selectedNode = nodes.find((node) => node.id === editingNodeId);

  if (!editingNodeId || !selectedNode) {
    return null;
  }

  return <NodeEditor selectedNode={selectedNode} onDeselect={deselect} />;
};

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

type NodeEditorProps = { selectedNode: ChartNode; onDeselect: () => void };

export const NodeEditor: FC<NodeEditorProps> = ({ selectedNode, onDeselect }) => {
  const setNodes = useSetRecoilState(nodesSelector);

  const updateNode = useStableCallback((node: ChartNode) => {
    setNodes((nodes) =>
      produce(nodes, (draft) => {
        const index = draft.findIndex((n) => n.id === node.id);
        draft[index] = node;
      }),
    );
  });

  const { Editor } = useUnknownNodeComponentDescriptorFor(selectedNode);

  const nodeEditor = Editor ? <Editor node={selectedNode} onChange={updateNode} /> : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDeselect?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDeselect]);

  const nodeDescriptionChanged = useStableCallback((description: string) => {
    updateNode({ ...selectedNode, description });
  });

  const nodeTitleChanged = useStableCallback((title: string) => {
    updateNode({ ...selectedNode, title });
  });

  return (
    <Container>
      <button className="close-button" onClick={onDeselect}>
        <MultiplyIcon />
      </button>
      <div className="section">
        <h3 className="section-title">Edit {getNodeDisplayName(selectedNode.type as NodeType)} Node</h3>
        <InlineEditableTextfield
          key={`node-title-${selectedNode.id}`}
          label="Node Title"
          placeholder="Enter a name for the node..."
          defaultValue={selectedNode.title}
          onConfirm={nodeTitleChanged}
          readViewFitContainerWidth
        />
      </div>
      <div className="section">
        <InlineEditableTextfield
          key={`node-description-${selectedNode.id}`}
          label="Node Description"
          defaultValue={selectedNode.description ?? ''}
          onConfirm={nodeDescriptionChanged}
          placeholder="Enter any description or notes for this node..."
          readViewFitContainerWidth
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
          <h3 className="section-title">{getNodeDisplayName(selectedNode.type as NodeType)}</h3>
          <div className="section-node-content">{nodeEditor}</div>
        </div>
      )}
    </Container>
  );
};
