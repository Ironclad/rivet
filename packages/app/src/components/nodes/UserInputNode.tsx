import { type FC } from 'react';
import { css } from '@emotion/react';
import { type Outputs, type PortId, expectType, getScalarTypeOf, type DataValue } from '@ironclad/rivet-core';
import { type NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';
import { type InputsOrOutputsWithRefs } from '../../state/dataFlow';

const questionsAndAnswersStyles = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  pre {
    white-space: pre-wrap;
  }
`;

export const UserInputNodeOutput: FC<{ outputs: InputsOrOutputsWithRefs }> = ({ outputs }) => {
  const questionsAndAnswers = outputs['questionsAndAnswers' as PortId];

  if (!questionsAndAnswers || getScalarTypeOf(questionsAndAnswers.type) === 'control-flow-excluded') {
    return null;
  }

  const qa = expectType(questionsAndAnswers as DataValue, 'string[]');

  return (
    <div css={questionsAndAnswersStyles}>
      {qa.map((value, i) => (
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
