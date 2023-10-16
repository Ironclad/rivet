import { css } from '@emotion/react';
import { type FC } from 'react';
import { useGraphHistoryNavigation } from '../hooks/useGraphHistoryNavigation';
import { ReactComponent as LeftIcon } from 'majesticons/line/chevron-left-line.svg';
import { ReactComponent as RightIcon } from 'majesticons/line/chevron-right-line.svg';

const styles = css`
  position: fixed;
  top: 50px;
  left: 275px;
  background: transparent;
  z-index: 50;
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  &.sidebar-closed {
    left: 25px;
  }

  .button-placeholder {
    width: 32px;
    height: 32px;
  }

  button {
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    border-radius: 5px;
    background: transparent;
    padding: 8px;
    width: 32px;
    height: 32px;
    justify-content: center;
    box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.4);

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export const NavigationBar: FC = () => {
  const navigationStack = useGraphHistoryNavigation();

  return (
    <div css={styles}>
      {navigationStack.hasBackward ? (
        <button onClick={navigationStack.navigateBack}>
          <LeftIcon />
        </button>
      ) : (
        <div className="button-placeholder" />
      )}

      {navigationStack.hasForward && (
        <button onClick={navigationStack.navigateForward}>
          <RightIcon />
        </button>
      )}
    </div>
  );
};
