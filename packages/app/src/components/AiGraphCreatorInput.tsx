import { css } from '@emotion/react';
import { useState, type FC, type KeyboardEvent } from 'react';
import TextArea from '@atlaskit/textarea';
import { swallowPromise } from '../utils/syncWrapper';
import { useAiGraphBuilder } from '../hooks/useAiGraphBuilder';
import { openai } from '@ironclad/rivet-core';
import Select from '@atlaskit/select';
import Button from '@atlaskit/button';
import { atom, useAtom } from 'jotai';
import Toggle from '@atlaskit/toggle';
import { Label } from '@atlaskit/form';
import { modelSelectorOptions } from '../utils/modelSelectorOptions';

const styles = css`
  position: fixed;
  top: calc(var(--project-selector-height) + 40px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--grey-darker);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  z-index: 50;
  gap: 8px;
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  user-select: none;
  width: 700px;

  .input-area {
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 8px;

    .model-selector {
      min-width: 200px;
    }
  }

  .feedback {
    font-size: 12px;
    color: var(--grey-light);
    padding: 8px;
  }
`;

export const showAiGraphCreatorInputState = atom(false);

export const AiGraphCreatorInput: FC = () => {
  const [prompt, setPrompt] = useState<string>('');

  const [running, setRunning] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState<string[]>([]);
  const [model, setModel] = useState<(typeof modelSelectorOptions)[number]>(modelSelectorOptions[1]);
  const [record, setRecord] = useState(true);

  const [show, setShow] = useAtom(showAiGraphCreatorInputState);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const buildFromPrompt = useAiGraphBuilder({
    record,
    onFeedback: (feedback) => {
      setFeedbackItems((prev) => [...prev, feedback].slice(-6));
    },
  });

  async function applyPrompt(prompt: string) {
    setRunning(true);
    const abortController = new AbortController();
    setAbortController(abortController);

    await buildFromPrompt(prompt, model.value, abortController.signal);
    setFeedbackItems([]);
    setShow(false);
    setRunning(false);
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      swallowPromise(applyPrompt(prompt));
      setPrompt('');
    }

    if (e.key === 'Escape') {
      setShow(false);
      setPrompt('');
      setFeedbackItems([]);
      setRunning(false);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div css={styles}>
      <div className="input-area">
        <TextArea
          isCompact
          isRequired
          isDisabled={running}
          isInvalid={false}
          isReadOnly={false}
          placeholder="Enter instructions for creating or editing the current graph..."
          value={prompt}
          autoFocus
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="model-selector">
          <Select
            options={modelSelectorOptions}
            value={model}
            isDisabled={running}
            onChange={(selectedOption) => setModel(selectedOption as (typeof modelSelectorOptions)[number])}
          />
        </div>
        <div className="go-button">
          {running ? (
            <Button
              appearance="danger"
              onClick={() => {
                abortController?.abort();
                setRunning(false);
                setFeedbackItems([]);
                setShow(false);
                setPrompt('');
                setAbortController(null);
              }}
            >
              Stop
            </Button>
          ) : (
            <Button isDisabled={running} onClick={() => swallowPromise(applyPrompt(prompt))} appearance="primary">
              Go
            </Button>
          )}
        </div>
      </div>
      <div className="feedback">
        {feedbackItems.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </div>
  );
};
