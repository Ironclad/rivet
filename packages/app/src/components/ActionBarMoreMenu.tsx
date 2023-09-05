import Portal from '@atlaskit/portal';
import Select from '@atlaskit/select';
import { css } from '@emotion/react';
import { FC, useRef } from 'react';
import { useSetRecoilState, useRecoilState } from 'recoil';
import { useLoadRecording } from '../hooks/useLoadRecording';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger';
import { selectedExecutorState } from '../state/execution';
import { debuggerPanelOpenState } from '../state/ui';
import { isInTauri } from '../utils/tauri';
import { settingsModalOpenState } from './SettingsModal';
import { ReactComponent as LinkIcon } from 'majesticons/line/link-circle-line.svg';
import { ReactComponent as GearIcon } from 'majesticons/line/settings-cog-line.svg';
import { ReactComponent as CpuIcon } from 'majesticons/line/cpu-line.svg';
import { ReactComponent as ForwardCircleIcon } from 'majesticons/line/forward-circle-line.svg';
import { ReactComponent as CopyIcon } from 'majesticons/line/clipboard-plus-line.svg';
import { CopyAsTestCaseModal } from './CopyAsTestCaseModal';
import { useToggle } from 'ahooks';

const moreMenuStyles = css`
  background-color: var(--grey-darkish);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  min-width: 250px;
  display: flex;
  flex-direction: column;

  * {
    font-family: 'Roboto', sans-serif;
  }

  .menu-item-button {
    padding: 0.5rem 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    height: 48px;
    border-radius: 5px;
    background-color: transparent;
    border: none;
    font-size: 14px;
    color: var(--grey-lighter);

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }

  .executor {
    display: flex;
    align-items: center;
    padding: 0 1rem;
    height: 48px;

    .executor-title,
    .select-executor-remote {
      color: var(--grey-lighter);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .select-executor-remote {
      margin-left: 0.5rem;
    }
  }
`;

const executorOptions = isInTauri()
  ? ([
      { label: 'Browser', value: 'browser' },
      { label: 'Node', value: 'node' },
    ] as const)
  : ([{ label: 'Browser', value: 'browser' }] as const);

export const ActionBarMoreMenu: FC<{
  onClose: () => void;
  onCopyAsTestCase: () => void;
}> = ({ onClose, onCopyAsTestCase }) => {
  const dropdownTarget = useRef<HTMLDivElement>(null);
  const setSettingsOpen = useSetRecoilState(settingsModalOpenState);
  const setDebuggerPanelOpen = useSetRecoilState(debuggerPanelOpenState);
  const [selectedExecutor, setSelectedExecutor] = useRecoilState(selectedExecutorState);
  const selectedExecutorOption = executorOptions.find((option) => option.value === selectedExecutor);
  const { loadRecording } = useLoadRecording();

  const openDebuggerPanel = () => {
    setDebuggerPanelOpen(true);
    onClose();
  };

  const doLoadRecording = () => {
    loadRecording();
    onClose();
  };

  const openSettings = () => {
    setSettingsOpen(true);
    onClose();
  };

  const { remoteDebuggerState: remoteDebugger } = useRemoteDebugger();
  const isActuallyRemoteDebugging = remoteDebugger.started && !remoteDebugger.isInternalExecutor;

  return (
    <div css={moreMenuStyles}>
      <Portal zIndex={1000}>
        <div ref={dropdownTarget} />
      </Portal>

      <div className="menu-item executor">
        <label htmlFor="select-executor" className="executor-title">
          <CpuIcon /> Executor:
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
            menuPortalTarget={dropdownTarget.current}
          />
        )}
      </div>
      <div className="menu-item menu-item-button remote-debugger" onClick={openDebuggerPanel}>
        <LinkIcon /> Remote Debugger
      </div>
      <div className="menu-item menu-item-button load-recording" onClick={doLoadRecording}>
        <ForwardCircleIcon /> Load Recording
      </div>
      <div className="menu-item menu-item-button copy-inputs-as-trivet-json" onClick={onCopyAsTestCase}>
        <CopyIcon /> Copy Inputs for Trivet
      </div>
      <div className="menu-item menu-item-button settings" onClick={openSettings}>
        <GearIcon /> Settings
      </div>
    </div>
  );
};
