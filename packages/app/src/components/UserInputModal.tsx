import { FC, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { ArrayDataValue, StringDataValue } from '../model/DataValue';
import { lastAnswersState } from '../state/userInput';
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from '@atlaskit/modal-dialog';
import Button from '@atlaskit/button';
import TextArea from '@atlaskit/textarea';
import { Field } from '@atlaskit/form';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
        <Modal width="large" onClose={onClose}>
          <ModalHeader>
            <ModalTitle>User Input</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {questions.map((question, index) => (
              <Field name={`question-${index}`} label={question} key={`question-${index}`}>
                {() => (
                  <TextArea
                    value={answers?.[index] ?? ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    autoFocus={index === 0}
                    resize="vertical"
                    minimumRows={4}
                  />
                )}
              </Field>
            ))}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleSubmit}>Submit</Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};
