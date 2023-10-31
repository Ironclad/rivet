import { type FC, Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { type UserInputNode, type ArrayDataValue, type StringDataValue, type NodeId } from '@ironclad/rivet-core';
import { lastAnswersState } from '../state/userInput.js';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import { css } from '@emotion/react';
import type { monaco } from '../utils/monaco.js';
import { useMarkdown } from '../hooks/useMarkdown.js';
import { LazyCodeEditor } from './LazyComponents';
import { projectState } from '../state/savedGraphs';
import { values } from '../../../core/src/utils/typeSafety';
import { toast } from 'react-toastify';
import { nodesState } from '../state/graph';

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
  questionsNodeId: NodeId | undefined;
  onSubmit: (answers: ArrayDataValue<StringDataValue>) => void;
  onClose?: () => void;
};

export const UserInputModal: FC<UserInputModalProps> = ({ open, questions, questionsNodeId, onSubmit, onClose }) => {
  const [answers, setAnswers] = useState<string[]>([]);
  const [lastAnswers, setLastAnswers] = useRecoilState(lastAnswersState);

  const project = useRecoilValue(projectState);
  const currentGraphNodes = useRecoilValue(nodesState);

  const questionsNode = useMemo(() => {
    if (!questionsNodeId) {
      return undefined;
    }

    const nodes = values(project.graphs).flatMap((graph) => graph.nodes);

    const node =
      currentGraphNodes.find((n) => n.id === questionsNodeId) ?? nodes.find((node) => node.id === questionsNodeId);

    if (!node) {
      console.warn(`Could not find node with ID ${questionsNodeId} for user input modal`);
    }

    return node as UserInputNode | undefined;
  }, [project, questionsNodeId, currentGraphNodes]);

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
                  node={questionsNode}
                  answer={answers?.[index]}
                  multipleQuestions={questions.length > 1}
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
  node: UserInputNode | undefined;
  multipleQuestions: boolean;
  onChange?: (index: number, newText: string) => void;
  onSubmit?: () => void;
}> = ({ question, answer, index, node, multipleQuestions, onChange, onSubmit }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>();

  const handleTextAreaKeyDown = (e: monaco.IKeyboardEvent) => {
    const enter: monaco.KeyCode = 3;
    if (e.keyCode === enter && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  const renderingFormat = node?.data.renderingFormat ?? 'markdown';

  const questionHtml = useMarkdown(question, renderingFormat === 'markdown');

  return (
    <Field name={`question-${index}`} label={multipleQuestions ? `Question ${index + 1}` : undefined}>
      {() => (
        <div>
          {renderingFormat === 'markdown' ? (
            <div className="question" dangerouslySetInnerHTML={questionHtml} />
          ) : (
            <pre className="question">{question}</pre>
          )}
          <div className="editor">
            <Suspense fallback={<div />}>
              <LazyCodeEditor
                key={question}
                text={answer ?? ''}
                onChange={(e) => onChange?.(index, e)}
                autoFocus
                onKeyDown={handleTextAreaKeyDown}
                editorRef={editorRef}
              />
            </Suspense>
          </div>
        </div>
      )}
    </Field>
  );
};
