import { css } from '@emotion/react';
import { FC } from 'react';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';

const styles = css`
  display: flex;
  justify-content: space-between;
  align-items: center;

  background-color: #2b2b2b;
  border-bottom: 1px solid var(--grey);
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;

  .dropdown-menu .dropdown-button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
    }
  }

  .run-button button {
    background-color: var(--success);
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background-color: var(--success-dark);
    }
  }
`;

export type MenuBarProps = {
  onRunGraph: () => void;
};

export const MenuBar: FC<MenuBarProps> = ({ onRunGraph }) => {
  return (
    <div css={styles}>
      <div className="dropdown-menu">
        <button className="dropdown-button">File</button>
      </div>
      <div className="run-button">
        <button onClick={onRunGraph}>
          Run <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
};
