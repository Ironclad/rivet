import { FC } from 'react';
import { css } from '@emotion/react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { PortId } from '../../model/NodeBase';
import { RenderDataValue } from '../RenderDataValue';
import { ChartNode } from '../../model/NodeBase';
import { ChatNode, ChatNodeData } from '../../model/nodes/ChatNode';
import Toggle from '@atlaskit/toggle';

type ChatNodeBodyProps = {
  node: ChatNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ChatNodeBody: FC<ChatNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Model: {node.data.model}</div>
      <div>
        {node.data.useTopP ? 'Top P' : 'Temperature'}: {node.data.useTopP ? node.data.top_p : node.data.temperature}
      </div>
      <div>Max Tokens: {node.data.maxTokens}</div>
    </div>
  );
};

export const ChatNodeOutput: FC<ChatNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.status === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['response' as PortId];
  return (
    <div className="pre-wrap">
      <RenderDataValue value={outputText} />
    </div>
  );
};

export type ChatNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode<'chat', ChatNodeData>) => void;
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

  .select,
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

  .select {
    justify-self: start;
    width: 150px;
  }

  .number-input {
    justify-self: start;
    min-width: 0;
    width: 100px;
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const ChatNodeEditor: FC<ChatNodeEditorProps> = ({ node, onChange }) => {
  const chatNode = node as ChatNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="model">
          Model
        </label>
        <select
          id="model"
          className="select"
          value={chatNode.data.model}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, model: e.target.value } })}
        >
          {/* Add your model options here */}
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-32k">GPT-4 32K</option>
        </select>
        <Toggle
          id="useModelInput"
          isChecked={chatNode.data.useModelInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useModelInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="temperature">
          Temperature
        </label>
        <input
          id="temperature"
          className="number-input"
          type="number"
          step="0.1"
          min="0"
          max="2"
          value={chatNode.data.temperature}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, temperature: e.target.valueAsNumber } })}
          disabled={chatNode.data.useTemperatureInput || chatNode.data.useTopP}
        />
        <Toggle
          id="useTemperatureInput"
          isChecked={chatNode.data.useTemperatureInput}
          onChange={(e) =>
            onChange?.({ ...chatNode, data: { ...chatNode.data, useTemperatureInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="top_p">
          Top P
        </label>
        <input
          id="top_p"
          className="number-input"
          type="number"
          step="0.1"
          min="0"
          max="1"
          value={chatNode.data.top_p}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, top_p: e.target.valueAsNumber } })}
          disabled={chatNode.data.useTopPInput || !chatNode.data.useTopP}
        />
        <Toggle
          id="useTopPInput"
          isChecked={chatNode.data.useTopPInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useTopPInput: e.target.checked } })}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="useTopP">
          Use Top P
        </label>
        <Toggle
          id="useTopP"
          isChecked={chatNode.data.useTopP}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useTopP: e.target.checked } })}
        />
        <div />
      </div>
      <div className="row">
        <label className="label" htmlFor="maxTokens">
          Max Tokens
        </label>
        <input
          id="maxTokens"
          className="number-input"
          type="number"
          step="1"
          min="0"
          max="32768"
          value={chatNode.data.maxTokens}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, maxTokens: e.target.valueAsNumber } })}
          disabled={chatNode.data.useMaxTokensInput}
        />
        <Toggle
          id="useMaxTokensInput"
          isChecked={chatNode.data.useMaxTokensInput}
          onChange={(e) => onChange?.({ ...chatNode, data: { ...chatNode.data, useMaxTokensInput: e.target.checked } })}
        />
      </div>
    </div>
  );
};
