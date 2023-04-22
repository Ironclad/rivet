import { FC, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
import { atom, useRecoilState } from 'recoil';
import { StringArrayDataValue } from '../model/DataValue';

type UserInputModalProps = {
  open: boolean;
  questionGroups: string[][];
  onSubmit: (answers: StringArrayDataValue[]) => void;
};

const lastAnswersState = atom<Record<string, string>>({
  key: 'lastAnswers',
  default: {},
});

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
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>User Input</DialogTitle>
      <DialogContent>
        {questionGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="question-group">
            {group.map((question, index) => (
              <TextField
                key={question}
                label={question}
                value={answers[index] ?? ''}
                onChange={(e) => handleChange(groupIndex, index, e.target.value)}
                fullWidth
                margin="normal"
                autoFocus={groupIndex === 0 && index === 0}
              />
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
