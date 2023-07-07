import { css } from '@emotion/react';
import { FC, useState } from 'react';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ReactComponent as PauseIcon } from 'majesticons/line/pause-circle-line.svg';
import { ReactComponent as PlayIcon } from 'majesticons/line/play-circle-line.svg';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphRunningState, graphPausedState } from '../state/dataFlow.js';
import clsx from 'clsx';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger.js';
import { DebuggerConnectPanel } from './DebuggerConnectPanel.js';
import Select from '@atlaskit/select';
import { loadedRecordingState, selectedExecutorState } from '../state/execution.js';
import { promptDesignerState } from '../state/promptDesigner.js';
import { useGlobalShortcut } from '../hooks/useGlobalShortcut.js';
import { useLoadRecording } from '../hooks/useLoadRecording.js';
import { useRunMenuCommand } from '../hooks/useMenuCommands.js';
import { isInTauri } from '../utils/tauri.js';

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
    user-select: none;
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

    &.active {
      background-color: var(--primary);
      color: var(--grey-dark);

      &:hover {
        background-color: var(--primary-light);
      }
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
  .pause-button button,
  .unload-recording-button button {
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

  .unload-recording-button button {
    background-color: var(--warning);
    color: var(--grey-dark);
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

  .executor {
    display: flex;
    align-items: center;

    .executor-title,
    .select-executor-remote {
      color: var(--foreground);
      font-size: 12px;
    }

    .select-executor-remote {
      margin-left: 0.5rem;
    }
  }
`;

export type MenuBarProps = {
  onRunGraph?: () => void;
  onRunTests?: () => void;
  onAbortGraph?: () => void;
  onPauseGraph?: () => void;
  onResumeGraph?: () => void;
};

const executorOptions = isInTauri()
  ? ([
      { label: 'Browser', value: 'browser' },
      { label: 'Node', value: 'node' },
    ] as const)
  : ([{ label: 'Browser', value: 'browser' }] as const);

export const MenuBar: FC<MenuBarProps> = ({ onRunGraph, onRunTests, onAbortGraph, onPauseGraph, onResumeGraph }) => {
  const [debuggerPanelOpen, setDebuggerPanelOpen] = useState(false);
  const [selectedExecutor, setSelectedExecutor] = useRecoilState(selectedExecutorState);
  const runMenuCommandImpl = useRunMenuCommand();
  const [fileMenuOpen, setFileMenuOpen] = useState(false);

  const graphRunning = useRecoilValue(graphRunningState);
  const graphPaused = useRecoilValue(graphPausedState);

  const loadedRecording = useRecoilValue(loadedRecordingState);
  const { unloadRecording } = useLoadRecording();

  const { remoteDebuggerState: remoteDebugger, connect, disconnect } = useRemoteDebugger();

  function handleConnectRemoteDebugger(url: string) {
    setDebuggerPanelOpen(false);
    connect(url);
  }

  const selectedExecutorOption = executorOptions.find((option) => option.value === selectedExecutor);

  const isActuallyRemoteDebugging = remoteDebugger.started && !remoteDebugger.isInternalExecutor;

  const [promptDesigner, setPromptDesigner] = useRecoilState(promptDesignerState);

  useGlobalShortcut('CmdOrCtrl+Shift+D', () => {
    if (isActuallyRemoteDebugging || remoteDebugger.reconnecting) {
      disconnect();
    } else {
      setDebuggerPanelOpen(true);
    }
  });

  const runMenuCommand: typeof runMenuCommandImpl = (command) => {
    setFileMenuOpen(false);
    runMenuCommandImpl(command);
  };

  return (
    <div css={styles}>
      <div className="left-menu">
        {!isInTauri() && (
          <div className="menu-item file-menu">
            <button className="dropdown-button" onMouseDown={() => setFileMenuOpen((open) => !open)}>
              File
            </button>
            <div className={clsx('file-dropdown', { open: fileMenuOpen })}>
              <button onMouseUp={() => runMenuCommand('new_project')}>New Project</button>
              <button onMouseUp={() => runMenuCommand('open_project')}>Open Project...</button>
              <button onMouseUp={() => runMenuCommand('save_project_as')}>Save Project As...</button>
              <button onMouseUp={() => runMenuCommand('settings')}>Settings</button>
              <button onMouseUp={() => runMenuCommand('export_graph')}>Export Graph</button>
              <button onMouseUp={() => runMenuCommand('import_graph')}>Import Graph</button>
            </div>
          </div>
        )}

        <div className="menu-item prompt-designer-menu">
          <button
            className={clsx('dropdown-item', { active: promptDesigner.isOpen })}
            onMouseDown={() => setPromptDesigner((s) => ({ ...s, isOpen: !s.isOpen }))}
          >
            Prompt Designer
          </button>
        </div>
        <div className="remote-debugger">
          <div
            className={clsx('menu-item remote-debugger-button', {
              active: isActuallyRemoteDebugging,
              reconnecting: remoteDebugger.reconnecting,
            })}
          >
            {isActuallyRemoteDebugging ? (
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

        <div className="executor">
          <label htmlFor="select-executor" className="executor-title">
            Executor:
          </label>
          {isActuallyRemoteDebugging ? (
            <span className="select-executor-remote">Remote</span>
          ) : (
            <Select
              id="select-executor"
              appearance="subtle"
              options={executorOptions}
              value={selectedExecutorOption}
              onChange={(selected) => setSelectedExecutor(selected!.value)}
              isSearchable={false}
              isClearable={false}
              styles={{
                control: (provided) => ({
                  ...provided,
                  height: 28,
                  minHeight: 28,
                  padding: 0,
                  border: 0,
                  fontSize: 12,
                }),
                valueContainer: (provided) => ({
                  ...provided,
                  minHeight: 28,
                  height: 28,
                  margin: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                }),
                indicatorsContainer: (provided) => ({
                  ...provided,
                  height: 28,
                }),
                singleValue: (provided) => ({
                  ...provided,
                  color: '#f0f0f0',
                  fontFamily: 'Roboto, sans-serif',
                }),
              }}
            />
          )}
        </div>
      </div>

      <div className="right-buttons">
        {loadedRecording && (
          <div className={clsx('unload-recording-button')}>
            <button onClick={() => unloadRecording()}>Unload Recording</button>
          </div>
        )}
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
        <div className={clsx('run-test-button', { running: graphRunning })}>
          <button onClick={graphRunning ? onAbortGraph : onRunTests}>
            Run Test <ChevronRightIcon />
          </button>
        </div>
        <div className={clsx('run-button', { running: graphRunning, recording: !!loadedRecording })}>
          <button onClick={graphRunning ? onAbortGraph : onRunGraph}>
            {graphRunning ? (
              <>
                Abort <MultiplyIcon />
              </>
            ) : loadedRecording ? (
              <>
                Play Recording <ChevronRightIcon />
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
