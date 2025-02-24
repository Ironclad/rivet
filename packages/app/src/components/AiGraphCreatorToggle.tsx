import { css } from '@emotion/react';
import { type FC } from 'react';
import SparklesIcon from '../assets/icons/ai-sparks-solid.svg?react';
import { showAiGraphCreatorInputState } from './AiGraphCreatorInput';
import { useSetAtom } from 'jotai';

const styles = css`
  position: absolute;
  left: 16px;
  bottom: 16px;

  button {
    width: 48px;
    height: 48px;
    background: var(--grey-darker);
    border-radius: 32px;
    border: 1px solid var(--grey-dark);
    z-index: 50;
    /* box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5); */
    cursor: pointer;
    color: var(--primary);

    svg {
      width: 24px;
      height: 24px;
    }

    &:hover {
      background: var(--grey-lightish);
      color: var(--grey-lightest);
    }
  }
`;

export const AiGraphCreatorToggle: FC = () => {
  const setShowAiGraphCreatorInput = useSetAtom(showAiGraphCreatorInputState);

  const handleClick = () => {
    setShowAiGraphCreatorInput((prev) => !prev);
  };

  return (
    <div css={styles}>
      <button onClick={handleClick}>
        <SparklesIcon />
      </button>
    </div>
  );
};
