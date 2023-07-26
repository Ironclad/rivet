import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilState } from 'recoil';
import { ArrayDataValue, StringDataValue } from '@ironclad/rivet-core';
import { lastAnswersState } from '../state/userInput.js';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import { marked } from 'marked';
import { CodeEditor } from './CodeEditor.js';
import { monaco } from '../utils/monaco.js';
import { useMarkdown } from '../hooks/useMarkdown.js';

const styles = css`
  .question {
    margin-bottom: 8px;
    font-family: 'Roboto', sans-serif;
  }

  .editor {
    min-height: 400px;
    display: flex;
    resize: vertical;

    > div {
      width: 100%;
    }
  }

  .question pre {
    white-space: pre-wrap;
  }
`;

type UserInputModalProps = {
  open: boolean;
  questions: string[];
  onSubmit: (answers: ArrayDataValue<StringDataValue>) => void;
  onClose?: () => void;
};

export const UserInputModal: FC<UserInputModalProps> = ({ open, questions, onSubmit, onClose }) => {
  const [answers, setAnswers] = useState<string[]>([]);
  const [lastAnswers, setLastAnswers] = useRecoilState(lastAnswersState);

  useEffect(() => {
    setAnswers(questions.map((question) => lastAnswers[question] ?? ''));
  }, [open, lastAnswers, questions]);

  const handleChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newLastAnswers = { ...lastAnswers };
    questions.forEach((question, index) => {
      newLastAnswers[question] = answers[index]!;
    });
    setLastAnswers(newLastAnswers);

    const results: ArrayDataValue<StringDataValue> = { type: 'string[]', value: answers };
    onSubmit(results);
  };

  return (
    <ModalTransition>
      {open && (
        <Modal width="x-large" onClose={onClose}>
          <ModalHeader>
            <ModalTitle>User Input</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div css={styles}>
              {questions.map((question, index) => (
                <UserInputModalQuestion
                  index={index}
                  key={`question-${index}`}
                  question={question}
                  answer={answers?.[index]}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                />
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSubmit}>Submit</Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

const UserInputModalQuestion: FC<{
  index: number;
  question: string;
  answer: string | undefined;
  onChange?: (index: number, newText: string) => void;
  onSubmit?: () => void;
}> = ({ question, answer, index, onChange, onSubmit }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  const handleTextAreaKeyDown = (e: monaco.IKeyboardEvent) => {
    if (e.keyCode === monaco.KeyCode.Enter && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const questionHtml = useMarkdown(question);

  return (
    <Field name={`question-${index}`} label={`Question ${index + 1}`}>
      {() => (
        <div>
          <div className="question" dangerouslySetInnerHTML={questionHtml} />
          <div className="editor">
            <CodeEditor
              key={question}
              text={answer ?? ''}
              onChange={(e) => onChange?.(index, e)}
              autoFocus
              onKeyDown={handleTextAreaKeyDown}
              editorRef={editorRef}
            />
          </div>
        </div>
      )}
    </Field>
  );
};
