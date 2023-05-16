import { FC, useEffect, useState } from 'react';
import { css } from '@emotion/react';
import Toggle from '@atlaskit/toggle';
import styled from '@emotion/styled';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import Button from '@atlaskit/button';
import { UserInputModal } from '../UserInputModal';
import { userInputModalQuestionsState, userInputModalSubmitState } from '../../state/userInput';
import { ArrayDataValue, PortId, StringDataValue, UserInputNode, expectType } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type UserInputNodeEditorProps = {
  node: UserInputNode;
  onChange?: (node: UserInputNode) => void;
};

const container = css`
  font-family: 'Roboto', sans-serif;
  color: var(--foreground);
  background-color: var(--grey-darker);

  display: grid;
  grid-template-columns: auto 1fr auto;
  width: 100%;
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

  .text-input {
    width: 100%;
    min-height: 100px;
  }

  .select {
    justify-self: start;
    width: 100%;
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

export const UserInputNodeEditor: FC<UserInputNodeEditorProps> = ({ node, onChange }) => {
  const userInputNode = node as UserInputNode;

  return (
    <div css={container}>
      <div className="row">
        <label className="label" htmlFor="prompt">
          Prompt
        </label>
        <textarea
          id="prompt"
          className="text-input"
          value={userInputNode.data.prompt}
          onChange={(e) => onChange?.({ ...userInputNode, data: { ...userInputNode.data, prompt: e.target.value } })}
          disabled={userInputNode.data.useInput}
        />
        <Toggle
          id="useInput"
          isChecked={userInputNode.data.useInput}
          onChange={(e) =>
            onChange?.({ ...userInputNode, data: { ...userInputNode.data, useInput: e.target.checked } })
          }
        />
      </div>
    </div>
  );
};

export type UserInputNodeBodyProps = {
  node: UserInputNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const UserInputNodeBody: FC<UserInputNodeBodyProps> = ({ node }) => {
  const allCurrentQuestions = useRecoilValue(userInputModalQuestionsState);
  const thisNodeQuestions = allCurrentQuestions[node.id];
  const userInputModalSubmit = useRecoilValue(userInputModalSubmitState);

  const [isModalOpen, setIsModalOpen] = useState(false);

  console.dir({ isModalOpen });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (answers: ArrayDataValue<StringDataValue>) => {
    // Handle the submission of the user input
    setIsModalOpen(false);
    userInputModalSubmit.submit(node.id, answers);
  };

  useEffect(() => {
    if (thisNodeQuestions && thisNodeQuestions.length > 0) {
      setIsModalOpen(true);
    }
  }, [thisNodeQuestions]);

  return (
    <>
      <Body>
        {node.data.useInput ? <span>(Using input)</span> : <span>{node.data.prompt}</span>}
        <div>
          {thisNodeQuestions && thisNodeQuestions.length > 0 && <Button onClick={handleOpenModal}>Open Modal</Button>}
        </div>
      </Body>
      <UserInputModal
        open={isModalOpen}
        questions={thisNodeQuestions ?? []}
        onSubmit={handleSubmit}
        onClose={handleCloseModal}
      />
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

export const UserInputNodeOutput: FC<UserInputNodeBodyProps> = ({ node }) => {
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

  const questionsAndAnswers = expectType(output.outputData?.['questionsAndAnswers' as PortId], 'string[]');

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
  Editor: UserInputNodeEditor,
  Output: UserInputNodeOutput,
};
