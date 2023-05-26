import { FC } from 'react';
import { ChartNode, MatchNode, MatchNodeData } from '@ironclad/nodai-core';
import { css } from '@emotion/react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { RenderDataValue } from '../RenderDataValue';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type MatchNodeEditorProps = {
  node: MatchNode;
  onChange?: (node: MatchNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr;
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
  .number-input,
  .text-input {
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

  .text-input {
    justify-self: start;
    min-width: 0;
    width: 500px;
  }

  .checkbox-input {
    margin-left: 8px;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }
`;

export const MatchNodeEditor: FC<MatchNodeEditorProps> = ({ node, onChange }) => {
  const matchNode = node as MatchNode;

  const handleCaseChange = (index: number, value: string) => {
    const newCases = [...matchNode.data.cases];
    newCases[index] = value;
    onChange?.({ ...matchNode, data: { ...matchNode.data, cases: newCases } });
  };

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="caseCount">
          Case Count
        </label>
        <input
          id="caseCount"
          className="number-input"
          type="number"
          step="1"
          min="1"
          max="100"
          value={matchNode.data.caseCount}
          onChange={(e) => {
            const newCount = e.target.valueAsNumber;
            const newCases = matchNode.data.cases.slice(0, newCount);
            for (let i = matchNode.data.cases.length; i < newCount; i++) {
              newCases.push('');
            }
            onChange?.({ ...matchNode, data: { ...matchNode.data, caseCount: newCount, cases: newCases } });
          }}
        />
      </div>
      {matchNode.data.cases.map((caseRegex, index) => (
        <div key={index} className="row">
          <label className="label" htmlFor={`case${index + 1}`}>
            Case {index + 1}
          </label>
          <input
            id={`case${index + 1}`}
            className="text-input"
            type="text"
            value={caseRegex}
            onChange={(e) => handleCaseChange(index, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
};

type MatchNodeBodyProps = {
  node: MatchNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MatchNodeBody: FC<MatchNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Case Count: {node.data.caseCount}</div>
      {node.data.cases.map((caseRegex, index) => (
        <div key={index}>
          Case {index + 1}: {caseRegex}
        </div>
      ))}
    </div>
  );
};

export const MatchNodeOutput: FC<MatchNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>{output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  return (
    <div>
      {Object.entries(output.outputData).map(([key, value]) => (
        <div key={key}>
          {key}: <RenderDataValue value={value} />
        </div>
      ))}
    </div>
  );
};

export const matchNodeDescriptor: NodeComponentDescriptor<'match'> = {
  Body: MatchNodeBody,
  Output: MatchNodeOutput,
  Editor: MatchNodeEditor,
};
