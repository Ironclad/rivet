import { FC } from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Outputs, PortId, UserInputNode, expectType } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type UserInputNodeBodyProps = {
  node: UserInputNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const UserInputNodeBody: FC<UserInputNodeBodyProps> = ({ node }) => {
  return (
    <>
      <Body>{node.data.useInput ? <span>(Using input)</span> : <span>{node.data.prompt}</span>}</Body>
    </>
  );
};

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
  Body: UserInputNodeBody,
  OutputSimple: UserInputNodeOutput,
};
