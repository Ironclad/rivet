import { FC } from 'react';
import styled from '@emotion/styled';
import { ChartNode, PortId, TrimChatMessagesNode, TrimChatMessagesNodeData } from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import { RenderDataValue } from '../RenderDataValue';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type TrimChatMessagesNodeBodyProps = {
  node: TrimChatMessagesNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const TrimChatMessagesNodeBody: FC<TrimChatMessagesNodeBodyProps> = ({ node }) => {
  return (
    <Body>
      Max Token Count: {node.data.maxTokenCount}
      <br />
      Remove From Beginning: {node.data.removeFromBeginning ? 'Yes' : 'No'}
    </Body>
  );
};

export type TrimChatMessagesNodeEditorProps = {
  node: TrimChatMessagesNode;
  onChange?: (node: TrimChatMessagesNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr auto;
  row-gap: 16px;
  column-gap: 32px;
  align-items: center;
  grid-auto-rows: 40px;

  .row {
    display: contents;
  }

  .label {
    font-weight: 500;
    color: var(--foreground);
  }

  .number-input {
    padding: 6px 12px;
    background-color: var(--grey-darkish);
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--foreground);
    outline: none;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary);
    }

    &:disabled {
      background-color: var(--grey-dark);
      border-color: var(--grey);
      color: var(--foreground-dark);
    }
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const TrimChatMessagesNodeEditor: FC<TrimChatMessagesNodeEditorProps> = ({ node, onChange }) => {
  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="maxTokenCount">
          Max Token Count
        </label>
        <input
          id="maxTokenCount"
          className="number-input"
          type="number"
          value={node.data.maxTokenCount}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, maxTokenCount: e.target.valueAsNumber },
            })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="removeFromBeginning">
          Remove From Beginning
        </label>
        <Toggle
          id="removeFromBeginning"
          isChecked={node.data.removeFromBeginning}
          onChange={(e) =>
            onChange?.({
              ...node,
              data: { ...node.data, removeFromBeginning: e.target.checked },
            })
          }
        />
      </div>
    </div>
  );
};

export interface TrimChatMessagesNodeOutputProps {
  node: TrimChatMessagesNode;
}

export const TrimChatMessagesNodeOutput: FC<TrimChatMessagesNodeOutputProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  return (
    <div>
      <RenderDataValue value={output.outputData['trimmed' as PortId]} />
    </div>
  );
};

export const trimChatMessagesNodeDescriptor: NodeComponentDescriptor<'trimChatMessages'> = {
  Body: TrimChatMessagesNodeBody,
  Output: TrimChatMessagesNodeOutput,
  Editor: TrimChatMessagesNodeEditor,
};
