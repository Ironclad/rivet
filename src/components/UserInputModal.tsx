import { FC, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, css } from '@mui/material';
import { useRecoilState } from 'recoil';
import { StringArrayDataValue } from '../model/DataValue';
import { lastAnswersState } from '../state/userInput';

type UserInputModalProps = {
  open: boolean;
  questionGroups: string[][];
  onSubmit: (answers: StringArrayDataValue[]) => void;
};

const textareaCss = css`
  padding: 6px 12px;
  background-color: var(--grey-darkish);
  border: 1px solid var(--grey);
  border-radius: 4px;
  color: var(--foreground);
  outline: none;
  transition: border-color 0.3s;
  min-height: 50px;
  width: 100%;

  &:hover {
    border-color: var(--primary);
  }

  &:disabled {
    background-color: var(--grey-dark);
    border-color: var(--grey);
    color: var(--foreground-dark);
  }
`;

const labelCss = css`
  display: block;
  font-weight: 500;
`;

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
    newAnswers[groupIndex][index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const newLastAnswers = { ...lastAnswers };
    questionGroups.forEach((group, groupIndex) => {
      group.forEach((question, index) => {
        newLastAnswers[question] = answers[groupIndex][index];
      });
    });
    setLastAnswers(newLastAnswers);

    const results = answers.map<StringArrayDataValue>((group) => ({ type: 'string[]', value: group }));
    onSubmit(results);
  };

  return (
    <Dialog open={open} maxWidth="sm" fullWidth onClose={handleSubmit}>
      <DialogTitle>User Input</DialogTitle>
      <DialogContent>
        {questionGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="question-group">
            {group.map((question, index) => (
              <div className="question" key={`question-${groupIndex}-${index}`}>
                <label css={labelCss} htmlFor="">
                  {question}
                </label>
                <textarea
                  css={textareaCss}
                  value={answers?.[groupIndex]?.[index] ?? ''}
                  onChange={(e) => handleChange(groupIndex, index, e.target.value)}
                  autoFocus={groupIndex === 0 && index === 0}
                />
              </div>
            ))}
          </div>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};
