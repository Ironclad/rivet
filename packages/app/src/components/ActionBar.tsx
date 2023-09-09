import { css } from '@emotion/react';
import clsx from 'clsx';
import { FC, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useLoadRecording } from '../hooks/useLoadRecording';
import { useSaveRecording } from '../hooks/useSaveRecording';
import { graphRunningState, graphPausedState } from '../state/dataFlow';
import { lastRecordingState, loadedRecordingState, selectedExecutorState } from '../state/execution';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ReactComponent as PauseIcon } from 'majesticons/line/pause-circle-line.svg';
import { ReactComponent as PlayIcon } from 'majesticons/line/play-circle-line.svg';
import { ReactComponent as MoreMenuVerticalIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import Popup from '@atlaskit/popup';
import { settingsModalOpenState } from './SettingsModal';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger';
import { isInTauri } from '../utils/tauri';
import Select from '@atlaskit/select';
import Portal from '@atlaskit/portal';
import { debuggerPanelOpenState } from '../state/ui';
import { ActionBarMoreMenu } from './ActionBarMoreMenu';
import { useCurrentExecution } from '../hooks/useCurrentExecution';
import { CopyAsTestCaseModal } from './CopyAsTestCaseModal';
import { useToggle } from 'ahooks';

const styles = css`
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--grey-darker);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  height: 32px;
  z-index: 50;
  display: flex;
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
  gap: 8px;

  .run-button button,
  .pause-button button,
  .unload-recording-button button,
  .run-test-button button,
  .save-recording-button button,
  .more-menu,
  .remote-debugger-button button {
    border: none;
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    height: 32px;
    border-radius: 5px;
  }

  .run-button button {
    background-color: var(--success);
    color: var(--grey-lightest);

    &:hover {
      background-color: var(--success-dark);
    }
  }

  .pause-button button,
  .save-recording-button button {
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

  .run-test-button button {
    background-color: var(--grey-darkish);
    color: var(--grey-lightest);

    &:hover {
      background-color: var(--grey);
    }
  }

  .more-menu {
    background-color: transparent;
    font-size: 32px;
    height: 32px;
    line-height: 0;
    padding: 0;
    width: 32px;
    height: 32px;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .remote-debugger-button.active button {
    background-color: var(--error);
  }

  .remote-debugger-button.reconnecting button {
    background-color: var(--warning);
    color: var(--grey-dark);
  }
`;

export type ActionBarProps = {
  onRunGraph?: () => void;
  onRunTests?: () => void;
  onAbortGraph?: () => void;
  onPauseGraph?: () => void;
  onResumeGraph?: () => void;
};

export const ActionBar: FC<ActionBarProps> = ({
  onRunGraph,
  onRunTests,
  onAbortGraph,
  onPauseGraph,
  onResumeGraph,
}) => {
  const lastRecording = useRecoilValue(lastRecordingState);
  const saveRecording = useSaveRecording();

  const graphRunning = useRecoilValue(graphRunningState);
  const graphPaused = useRecoilValue(graphPausedState);

  const loadedRecording = useRecoilValue(loadedRecordingState);
  const { unloadRecording } = useLoadRecording();
  const [menuIsOpen, toggleMenuIsOpen] = useToggle();

  const { remoteDebuggerState: remoteDebugger, disconnect } = useRemoteDebugger();
  const isActuallyRemoteDebugging = remoteDebugger.started && !remoteDebugger.isInternalExecutor;
  const [copyAsTestCaseModalOpen, toggleCopyAsTestCaseModalOpen] = useToggle();

  return (
    <div css={styles}>
      {(isActuallyRemoteDebugging || remoteDebugger.reconnecting) && (
        <div
          className={clsx('remote-debugger-button active', {
            reconnecting: remoteDebugger.reconnecting,
          })}
        >
          <button onClick={() => disconnect()}>
            {remoteDebugger.reconnecting ? 'Remote Debugger (Reconnecting...)' : 'Disconnect Remote Debugger'}
          </button>
        </div>
      )}

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
      {/* <div className={clsx('run-test-button', { running: graphRunning })}>
        <button onClick={graphRunning ? onAbortGraph : onRunTests}>
          Run Test <ChevronRightIcon />
        </button>
      </div> */}
      {lastRecording && (
        <div className={clsx('save-recording-button')}>
          <button onClick={saveRecording}>Save Recording</button>
        </div>
      )}
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
      <Popup
        isOpen={menuIsOpen}
        onClose={toggleMenuIsOpen.setLeft}
        content={() => (
          <ActionBarMoreMenu
            onClose={toggleMenuIsOpen.setLeft}
            onCopyAsTestCase={toggleCopyAsTestCaseModalOpen.setRight}
          />
        )}
        placement="bottom-end"
        trigger={(triggerProps) => (
          <button
            className="more-menu"
            {...triggerProps}
            onMouseDown={(e) => {
              if (e.button === 0) {
                toggleMenuIsOpen.toggle();
                e.preventDefault();
              }
            }}
          >
            <MoreMenuVerticalIcon />
          </button>
        )}
      />
      <CopyAsTestCaseModal open={copyAsTestCaseModalOpen} onClose={toggleCopyAsTestCaseModalOpen.setLeft} />
    </div>
  );
};
