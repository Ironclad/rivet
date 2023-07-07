import { FC } from 'react';
import { ChartNode, MatchNode, NumberEditorDefinition } from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { DefaultNumberEditor, defaultEditorContainerStyles } from '../DefaultNodeEditor.js';
import TextField from '@atlaskit/textfield';
import { Label } from '@atlaskit/form';

export type MatchNodeEditorProps = {
  node: MatchNode;
  onChange?: (node: MatchNode) => void;
};

export const MatchNodeEditor: FC<MatchNodeEditorProps> = ({ node, onChange }) => {
  const matchNode = node as MatchNode;

  const handleCaseChange = (index: number, value: string) => {
    const newCases = [...matchNode.data.cases];
    newCases[index] = value;
    onChange?.({ ...matchNode, data: { ...matchNode.data, cases: newCases } });
  };

  return (
    <div css={defaultEditorContainerStyles}>
      <div className="row">
        <DefaultNumberEditor
          node={node}
          onChange={(changed) => {
            const newCount = (changed as MatchNode).data.caseCount;
            const newCases = matchNode.data.cases.slice(0, newCount);
            for (let i = matchNode.data.cases.length; i < newCount; i++) {
              newCases.push('');
            }
            onChange?.({ ...matchNode, data: { ...matchNode.data, caseCount: newCount, cases: newCases } });
          }}
          editor={
            {
              type: 'number',
              dataKey: 'caseCount',
              label: 'Case Count',
              min: 1,
              max: 100,
              step: 1,
            } as NumberEditorDefinition<MatchNode> as NumberEditorDefinition<ChartNode>
          }
        />
      </div>
      {matchNode.data.cases.map((caseRegex, index) => (
        <div key={index} className="row">
          <div>
            <Label htmlFor={`case${index + 1}`}>Case {index + 1}</Label>
            <TextField
              id={`case${index + 1}`}
              className="text-input"
              type="text"
              value={caseRegex}
              onChange={(e) => handleCaseChange(index, (e.target as HTMLInputElement).value)}
            />
          </div>
          <div />
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

export const matchNodeDescriptor: NodeComponentDescriptor<'match'> = {
  Body: MatchNodeBody,
  Editor: MatchNodeEditor,
};
