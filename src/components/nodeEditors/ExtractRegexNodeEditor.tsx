import { FC } from 'react';
import { ChartNode } from '../../model/NodeBase';
import { ExtractRegexNode, ExtractRegexNodeData } from '../../model/nodes/ExtractRegexNode';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';

export type ExtractRegexNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode<'extractRegex', ExtractRegexNodeData>) => void;
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

export const ExtractRegexNodeEditor: FC<ExtractRegexNodeEditorProps> = ({ node, onChange }) => {
  const extractRegexNode = node as ExtractRegexNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="regex">
          Regex
        </label>
        <input
          id="regex"
          className="select"
          type="text"
          value={extractRegexNode.data.regex}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, regex: e.target.value } })
          }
          disabled={extractRegexNode.data.useRegexInput}
        />
        <Toggle
          id="useRegexInput"
          isChecked={extractRegexNode.data.useRegexInput}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, useRegexInput: e.target.checked } })
          }
        />
      </div>
      <div className="row">
        <label className="label" htmlFor="errorOnFailed">
          Error on Failed
        </label>
        <Toggle
          id="errorOnFailed"
          isChecked={extractRegexNode.data.errorOnFailed}
          onChange={(e) =>
            onChange?.({ ...extractRegexNode, data: { ...extractRegexNode.data, errorOnFailed: e.target.checked } })
          }
        />
      </div>
    </div>
  );
};
