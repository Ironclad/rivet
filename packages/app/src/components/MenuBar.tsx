import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ReactComponent as PauseIcon } from 'majesticons/line/pause-circle-line.svg';
import { ReactComponent as PlayIcon } from 'majesticons/line/play-circle-line.svg';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { settingsModalOpenState } from './SettingsModal';
import { loadGraphData, saveGraphData } from '../utils/fileIO';
import { graphState } from '../state/graph';
import { graphRunningState, graphPausedState } from '../state/dataFlow';
import clsx from 'clsx';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger';
import { useLoadProject } from '../hooks/useLoadProject';
import { useSaveProject } from '../hooks/useSaveProject';
import { useNewProject } from '../hooks/useNewProject';
import { DebuggerConnectPanel } from './DebuggerConnectPanel';

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

  .right-buttons {
    display: flex;
  }

  .run-button button,
  .pause-button button {
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .run-button button {
    background-color: var(--success);
    color: #ffffff;

    &:hover {
      background-color: var(--success-dark);
    }
  }

  .pause-button button {
    background-color: rgba(255, 255, 255, 0.1);

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  .run-button.running button {
    background-color: var(--error);
  }

  .pause-button.paused button {
    background-color: var(--warning);
    color: var(--grey-dark);

    &:hover {
      background-color: var(--warning-dark);
    }
  }

  .file-menu {
    position: relative;
  }

  .file-dropdown {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: var(--grey-darkest);
    border: 2px solid var(--grey-darkish);
    border-radius: 4px;
    box-shadow: 0 8px 16px var(--shadow-dark);
    font-family: 'Roboto Mono', monospace;
    color: var(--foreground);
    font-size: 13px;
    padding: 8px;
    z-index: 1;
    min-width: 150px;
    user-select: none;
  }

  .file-dropdown button {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    padding: 4px 8px;
    white-space: nowrap;
    background: transparent;
    border: 0;
    display: block;
    width: 100%;
    justify-content: flex-start;
    text-align: left;
    font-size: 14px;
    transition: background-color 0.1s ease-out, color 0.1s ease-out;

    &:hover {
      background-color: #4444446e;
      color: var(--primary);
    }
  }

  .dropdown-button {
    background-color: transparent;
    color: #ffffff;
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;

    &:hover {
      background-color: var(--grey);
      color: var(--primary);
    }
  }

  .file-dropdown.open {
    display: block;
  }

  .remote-debugger {
    position: relative;
  }

  .remote-debugger-button.active button {
    background-color: var(--error);
  }

  .remote-debugger-button.reconnecting button {
    background-color: var(--warning);
    color: var(--grey-dark);
  }
`;

export type MenuBarProps = {
  onRunGraph?: () => void;
  onAbortGraph?: () => void;
  onPauseGraph?: () => void;
  onResumeGraph?: () => void;
};

export const MenuBar: FC<MenuBarProps> = ({ onRunGraph, onAbortGraph, onPauseGraph, onResumeGraph }) => {
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const [graphData, setGraphData] = useRecoilState(graphState);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const loadProject = useLoadProject();
  const { saveProject } = useSaveProject();
  const newProject = useNewProject();
  const [debuggerPanelOpen, setDebuggerPanelOpen] = useState(false);

  const graphRunning = useRecoilValue(graphRunningState);
  const graphPaused = useRecoilValue(graphPausedState);

  const { remoteDebuggerState: remoteDebugger, connect, disconnect } = useRemoteDebugger();

  function handleNewProject() {
    newProject();
    setFileMenuOpen(false);
  }

  function handleLoadProject() {
    loadProject();
    setFileMenuOpen(false);
  }

  function handleSaveProject() {
    saveProject();
    setFileMenuOpen(false);
  }

  function handleConnectRemoteDebugger(url: string) {
    setDebuggerPanelOpen(false);
    connect(url);
  }

  return (
    <div css={styles}>
      <div className="left-menu">
        <div className="menu-item file-menu">
          <button className="dropdown-button" onClick={() => setFileMenuOpen((open) => !open)}>
            File
          </button>
          <div className={clsx('file-dropdown', { open: fileMenuOpen })}>
            <button onClick={handleNewProject}>New Project</button>
            <button onClick={handleLoadProject}>Open Project</button>
            <button onClick={handleSaveProject}>Save Project</button>
          </div>
        </div>
        <div className="menu-item settings-button">
          <button onClick={() => setSettingsOpen(true)}>Settings</button>
        </div>
        <div className="menu-item export-button">
          <button onClick={() => saveGraphData(graphData)}>Export Graph</button>
        </div>
        <div className="menu-item import-button">
          <button onClick={() => loadGraphData((data) => setGraphData(data))}>Import</button>
        </div>
        <div className="remote-debugger">
          <div
            className={clsx('menu-item remote-debugger-button', {
              active: remoteDebugger.started,
              reconnecting: remoteDebugger.reconnecting,
            })}
          >
            {remoteDebugger.started ? (
              <button onClick={() => disconnect()}>Disconnect Remote Debugger</button>
            ) : (
              <button onClick={() => (remoteDebugger.reconnecting ? disconnect() : setDebuggerPanelOpen(true))}>
                {remoteDebugger.reconnecting ? 'Remote Debugger (Reconnecting...)' : 'Remote Debugger'}
              </button>
            )}
          </div>
          {debuggerPanelOpen && (
            <DebuggerConnectPanel
              onConnect={handleConnectRemoteDebugger}
              onCancel={() => setDebuggerPanelOpen(false)}
            />
          )}
        </div>
      </div>
      <div className="right-buttons">
        {graphRunning && (
          <div className={clsx('pause-button', { paused: graphPaused })}>
            <button onClick={graphPaused ? onResumeGraph : onPauseGraph}>
              {graphPaused ? (
                <>
                  Resume <PlayIcon />
                </>
              ) : (
                <>
                  Pause <PauseIcon />
                </>
              )}
            </button>
          </div>
        )}
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
    </div>
  );
};
