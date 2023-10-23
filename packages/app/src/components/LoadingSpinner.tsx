import { css } from '@emotion/react';
import PinwheelIcon from 'majesticons/line/pinwheel-line.svg?react';
import { type FC } from 'react';

const spinnerCss = css`
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    color: var(--primary-text);
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingSpinner: FC = () => {
  return (
    <div css={spinnerCss}>
      <PinwheelIcon />
    </div>
  );
};
