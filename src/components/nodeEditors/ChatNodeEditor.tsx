import { FC, ChangeEvent } from 'react';
import { ChartNode } from '../../model/NodeBase';
import { ChatNode, ChatNodeData } from '../../model/nodes/ChatNode';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';

export type ChatNodeEditorProps = {
  node: ChartNode<string, unknown>;
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

const handleInputChange =
  (key: keyof ChatNodeData, node: ChatNode, onChange?: (node: ChartNode<'chat', ChatNodeData>) => void) =>
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    onChange?.({
      ...node,
      data: {
        ...node.data,
        [key]: value,
      },
    });
  };

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
          onChange={handleInputChange('model', chatNode, onChange)}
        >
          {/* Add your model options here */}
          <option value="gpt-3.5-turbo">GPT-3.5-Turbo</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-4-32k">GPT-4 32K</option>
        </select>
        <Toggle
          id="useModelInput"
          isChecked={chatNode.data.useModelInput}
          onChange={handleInputChange('useModelInput', chatNode, onChange)}
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
          onChange={handleInputChange('temperature', chatNode, onChange)}
          disabled={chatNode.data.useTemperatureInput || chatNode.data.useTopP}
        />
        <Toggle
          id="useTemperatureInput"
          isChecked={chatNode.data.useTemperatureInput}
          onChange={handleInputChange('useTemperatureInput', chatNode, onChange)}
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
          onChange={handleInputChange('top_p', chatNode, onChange)}
          disabled={chatNode.data.useTopPInput || !chatNode.data.useTopP}
        />
        <Toggle
          id="useTopPInput"
          isChecked={chatNode.data.useTopPInput}
          onChange={handleInputChange('useTopPInput', chatNode, onChange)}
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="useTopP">
          Use Top P
        </label>
        <Toggle
          id="useTopP"
          isChecked={chatNode.data.useTopP}
          onChange={handleInputChange('useTopP', chatNode, onChange)}
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
          onChange={handleInputChange('maxTokens', chatNode, onChange)}
          disabled={chatNode.data.useMaxTokensInput}
        />
        <Toggle
          id="useMaxTokensInput"
          isChecked={chatNode.data.useMaxTokensInput}
          onChange={handleInputChange('useMaxTokensInput', chatNode, onChange)}
        />
      </div>
    </div>
  );
};
