import { css } from '@emotion/react';
import { FC } from 'react';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from './SettingsModal';
import { loadGraphData, saveGraphData } from '../utils/fileIO';
import { graphState } from '../state/graph';
import { emptyNodeGraph } from '../model/NodeGraph';
import { useSaveCurrentGraph } from '../hooks/useSaveCurrentGraph';
import { graphRunningState } from '../state/dataFlow';
import clsx from 'clsx';

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

  .left-menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .menu-item > button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
    }
  }

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

  .run-button.running button {
    background-color: var(--error);
  }
`;

export type MenuBarProps = {
  onRunGraph?: () => void;
  onAbortGraph?: () => void;
};

export const MenuBar: FC<MenuBarProps> = ({ onRunGraph, onAbortGraph }) => {
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const [graphData, setGraphData] = useRecoilState(graphState);

  const saveGraph = useSaveCurrentGraph();
  const graphRunning = useRecoilValue(graphRunningState);

  function handleNew() {
    setGraphData(emptyNodeGraph());
  }

  return (
    <div css={styles}>
      <div className="left-menu">
        <div className="menu-item dropdown-menu">
          <button className="dropdown-button" onClick={handleNew}>
            New
          </button>
        </div>
        <div className="menu-item settings-button">
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
        <div className="menu-item save-button">
          <button onClick={saveGraph}>Save</button>
        </div>
        <div className="menu-item export-button">
          <button onClick={() => saveGraphData(graphData)}>Export</button>
        </div>
        <div className="menu-item import-button">
          <button onClick={() => loadGraphData((data) => setGraphData(data))}>Import</button>
        </div>
      </div>
      <div className={clsx('run-button', { running: graphRunning })}>
        <button onClick={graphRunning ? onAbortGraph : onRunGraph}>
          {graphRunning ? (
            <>
              Abort <MultiplyIcon />
            </>
          ) : (
            <>
              Run <ChevronRightIcon />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
