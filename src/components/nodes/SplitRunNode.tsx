import { FC } from 'react';
import { SplitRunNode, SplitRunNodeData } from '../../model/nodes/SplitRunNode';
import { css } from '@emotion/react';
import { ChartNode } from '../../model/NodeBase';

export type SplitRunNodeBodyProps = { node: SplitRunNode };

export const SplitRunNodeBody: FC<SplitRunNodeBodyProps> = ({ node }) => {
  const { max } = node.data;

  return (
    <div>
      <div>Max: {max}</div>
    </div>
  );
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

export type SplitRunNodeEditorProps = {
  node: SplitRunNode;
  onChange?: (node: SplitRunNode) => void;
};

export const SplitRunNodeEditor: FC<SplitRunNodeEditorProps> = ({ node, onChange }) => {
  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="max-split">
          Max
        </label>
        <input
          id="max-split"
          className="select"
          type="number"
          min="0"
          step="1"
          max="100000"
          value={node.data.max}
          onChange={(e) => onChange?.({ ...node, data: { ...node.data, max: e.target.valueAsNumber } })}
        />
      </div>
    </div>
  );
};
