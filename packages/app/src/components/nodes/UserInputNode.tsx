import { type FC } from 'react';
import { css } from '@emotion/react';
import { type Outputs, type PortId, expectType } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

const questionsAndAnswersStyles = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  pre {
    white-space: pre-wrap;
  }
`;

export const UserInputNodeOutput: FC<{ outputs: Outputs }> = ({ outputs }) => {
  const questionsAndAnswers = expectType(outputs['questionsAndAnswers' as PortId], 'string[]');

  return (
    <div css={questionsAndAnswersStyles}>
      {questionsAndAnswers.map((value, i) => (
        <div key={`qa-${i}`}>
          <pre>{value}</pre>
        </div>
      ))}
    </div>
  );
};

export const userInputNodeDescriptor: NodeComponentDescriptor<'userInput'> = {
  OutputSimple: UserInputNodeOutput,
};
