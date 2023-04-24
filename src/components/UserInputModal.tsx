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
  questionGroups: string[][];
  onSubmit: (answers: ArrayDataValue<StringDataValue>[]) => void;
};

export const UserInputModal: FC<UserInputModalProps> = ({ open, questionGroups, onSubmit }) => {
  const [answers, setAnswers] = useState<string[][]>([]);
  const [lastAnswers, setLastAnswers] = useRecoilState(lastAnswersState);

  useEffect(() => {
    setAnswers(questionGroups.map((group) => group.map((question) => lastAnswers[question] ?? '')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (groupIndex: number, index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[groupIndex] ??= [];
    newAnswers[groupIndex]![index]! = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newLastAnswers = { ...lastAnswers };
    questionGroups.forEach((group, groupIndex) => {
      group.forEach((question, index) => {
        newLastAnswers[question] = answers[groupIndex]![index]!;
      });
    });
    setLastAnswers(newLastAnswers);

    const results = answers.map<ArrayDataValue<StringDataValue>>((group) => ({ type: 'string[]', value: group }));
    onSubmit(results);
  };

  return (
    <ModalTransition>
      {open && (
        <Modal width="large">
          <ModalHeader>
            <ModalTitle>User Input</ModalTitle>
          </ModalHeader>
          <ModalBody>
            {questionGroups.map((group, groupIndex) => (
              <div key={`group-${groupIndex}`} className="question-group">
                {group.map((question, index) => (
                  <Field
                    name={`question-${groupIndex}-${index}`}
                    label={question}
                    key={`question-${groupIndex}-${index}`}
                  >
                    {() => (
                      <TextArea
                        value={answers?.[groupIndex]?.[index] ?? ''}
                        onChange={(e) => handleChange(groupIndex, index, e.target.value)}
                        autoFocus={groupIndex === 0 && index === 0}
                        resize="vertical"
                        minimumRows={4}
                      />
                    )}
                  </Field>
                ))}
              </div>
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
