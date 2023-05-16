import { css } from '@emotion/react';
import { ReactComponent as PinwheelIcon } from 'majesticons/line/pinwheel-line.svg';
import { FC } from 'react';

const spinnerCss = css`
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    color: var(--primary);
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
