import { css } from '@emotion/react';
import clsx from 'clsx';
import { FC, useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { useLoadRecording } from '../hooks/useLoadRecording';
import { useSaveRecording } from '../hooks/useSaveRecording';
import { graphRunningState, graphPausedState } from '../state/dataFlow';
import { lastRecordingState, loadedRecordingState, selectedExecutorState } from '../state/execution';
import { ReactComponent as ChevronRightIcon } from 'majesticons/line/chevron-right-line.svg';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ReactComponent as PauseIcon } from 'majesticons/line/pause-circle-line.svg';
import { ReactComponent as PlayIcon } from 'majesticons/line/play-circle-line.svg';
import { ReactComponent as EditPen } from 'majesticons/line/edit-pen-2-line.svg';
import { ReactComponent as TestTube } from 'majesticons/line/test-tube-filled-line.svg';
import { ReactComponent as MoreMenuVerticalIcon } from 'majesticons/line/more-menu-vertical-line.svg';
import Popup from '@atlaskit/popup';
import { settingsModalOpenState } from './SettingsModal';
import { toast } from 'react-toastify';
import { useRemoteDebugger } from '../hooks/useRemoteDebugger';
import { fillMissingSettingsFromEnvironmentVariables, isInTauri } from '../utils/tauri';
import Select from '@atlaskit/select';
import Portal from '@atlaskit/portal';
import { debuggerPanelOpenState } from '../state/ui';
import { ActionBarMoreMenu } from './ActionBarMoreMenu';
import { useCurrentExecution } from '../hooks/useCurrentExecution';
import { CopyAsTestCaseModal } from './CopyAsTestCaseModal';
import gentraceImage from '../assets/node_images/gentrace.svg';
import { useToggle } from 'ahooks';
import { useDependsOnPlugins } from '../hooks/useDependsOnPlugins';
import { getGentracePipelines, runGentraceTests } from '../../../core/src/plugins/gentrace/plugin';
import { graphState } from '../state/graph';
import { projectState } from '../state/savedGraphs.js';
import { settingsState } from '../state/settings';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { TauriNativeApi } from '../model/native/TauriNativeApi';

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
  .run-gentrace-button button,
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

  .run-gentrace-button button,
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
  
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  
  console.log('graph', graph);
  
  const savedSettings = useRecoilValue(settingsState);
  const loadedRecording = useRecoilValue(loadedRecordingState);
  const { unloadRecording } = useLoadRecording();
  const [menuIsOpen, toggleMenuIsOpen] = useToggle();
  
  const [gentracePipelineSelectorOpen, toggleGentracePipelineSelectorOpen] = useToggle(false);

  const { remoteDebuggerState: remoteDebugger, disconnect } = useRemoteDebugger();
  const isActuallyRemoteDebugging = remoteDebugger.started && !remoteDebugger.isInternalExecutor;
  const [copyAsTestCaseModalOpen, toggleCopyAsTestCaseModalOpen] = useToggle();
  
  const plugins = useDependsOnPlugins();
  
  const gentracePlugin = plugins.find(plugin => plugin.id === 'gentrace');
  const isGentracePluginEnabled = !!gentracePlugin;

  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

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
     
    {isGentracePluginEnabled && (
      <Popup
        isOpen={gentracePipelineSelectorOpen}
        onClose={() => {
          toggleGentracePipelineSelectorOpen.set(false);
        }}
        content={() => (
          <GentracePipelinePicker onClose={toggleGentracePipelineSelectorOpen.setLeft} />
        )}
        placement="bottom-end"
        trigger={(triggerProps) => (
          <div className={clsx('run-gentrace-button')}>
            <button
              {...triggerProps}
              onMouseDown={(e) => {
                if (e.button === 0) {
                  toggleGentracePipelineSelectorOpen.toggle();
                  e.preventDefault();
                }
              }}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div>
                <img height={18} src={gentraceImage} alt="Gentrace" />
              </div>
              {currentGentracePipelineSlug ? "Change" : "Add"} Gentrace Pipeline
              <EditPen />
            </button>
          </div>
        )}
      />
    )}

     {isGentracePluginEnabled && (
        <div className={clsx('run-gentrace-button')}>
          <button onClick={async () => {
            const settings = await fillMissingSettingsFromEnvironmentVariables(
              savedSettings,
              globalRivetNodeRegistry.getPlugins()
            ); 
           
            if (!graph.metadata?.id) {
              return; 
            }
            
            if (!currentGentracePipelineSlug) {
              toast.warn('No Gentrace pipeline added.');
              return;
            }

            toast.info(`Running Gentrace pipeline ${currentGentracePipelineSlug} tests ...`);
            let testResultId: string | null = null;
            
            try {
              const testResponse = await runGentraceTests(currentGentracePipelineSlug, settings, project, graph, new TauriNativeApi());
              testResultId = testResponse.resultId;
            } catch (e: any) {
              console.log('Error running Gentrace pipeline tests', e,);
              const serverResult = e?.response?.data?.message ?? e?.message;
              toast.error((
                <div>
                  <div style={{
                    marginBottom: 10
                  }}>
                    Error running Gentrace pipeline {currentGentracePipelineSlug} tests: 
                  </div>
                  
                  <div>
                    <code style={{
                      fontSize: 12
                    }}>
                      {serverResult}
                    </code>
                  </div>
                </div>
              ), {
                autoClose: false,
                closeOnClick: false,
                draggable: false
              });
              return;
            }
            
            const url = `http://gentrace.ai/pipeline/${gentracePipelineSettings.id}/results/${testResultId}?size=compact`;

            toast.info((
              <div>
                <div>
                  Gentrace pipeline {currentGentracePipelineSlug} tests finished.
                </div>
                <div>
                  View results here <a href={url} target="_blank" rel="noreferrer">{url}</a>
                </div>
              </div>
            ), {
              autoClose: false,
              closeOnClick: false,
              draggable: false
            });
          }}>
            <div>
              <img height={18} src={gentraceImage} alt="Gentrace" />
            </div>
            Run Gentrace Tests
            <TestTube />
          </button>
        </div>
     )} 

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

type GentracePipelinePickerProps = {
  onClose: () => void;
}

type ArrayType<T> = T extends Array<infer U> ? U : never;
type GentracePipeline = ArrayType<Awaited<ReturnType<typeof getGentracePipelines>>>

const pickerContainerStyles = css`
  background-color: var(--grey-darkish);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  min-width: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;

  * {
    font-family: 'Roboto', sans-serif;
  }
`;

const GentracePipelinePicker: FC<GentracePipelinePickerProps> = ({ onClose }) => {
  const savedSettings = useRecoilValue(settingsState);
  
  const [graph, setGraph] = useRecoilState(graphState);
 
  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

  const gentraceApiKey = savedSettings.pluginSettings?.gentrace?.gentraceApiKey as string | undefined;
 
  const [pipelines, setPipelines] = useState<GentracePipeline[]>([]);
  
  const [selectedPipelineOption, setSelectedPipeline] = useState<{ label: string, value: string } | null>(null);
  
  useEffect(() => {
    if (!gentraceApiKey) {
      return;
    }
    
    getGentracePipelines(gentraceApiKey).then(ps => {
      setPipelines(ps);
    });
    
  }, [gentraceApiKey]);
  
  const dropdownTarget = useRef<HTMLDivElement>(null);
  
  const pipelineOptions = pipelines.map(p => ({
    label: p.displayName ?? p.slug, 
    value: p.slug
  }));
  
  const currentOption = pipelineOptions.find(o => o.value === currentGentracePipelineSlug); 

  const effectiveSelectedPipeline = selectedPipelineOption ?? currentOption ?? pipelineOptions[0] ?? null;

  return (
    <div css={pickerContainerStyles}>
      <Portal zIndex={1000}>
        <div ref={dropdownTarget} />
      </Portal>

      <div style={{
        marginBottom: 10,
        fontWeight: 500,
        fontSize: 15,
      }}>
        Select Gentrace Pipeline
      </div>

      <div style={{
        marginBottom: 10
      }}>
        <Select
          id="gentrace-pipeline-selector"
          appearance="subtle"
          options={pipelineOptions}
          value={effectiveSelectedPipeline}
          onChange={(selected) => setSelectedPipeline(selected)}
          isSearchable={true}
          menuPortalTarget={dropdownTarget.current}
        />
      </div>
     
      <div>
        <button style={{
          border: "none",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          margin: 0,
          height: "32px",
          borderRadius: "5px",
          background: selectedPipelineOption ? "var(--success)" : "var(--grey-darker)"
        }} disabled={!selectedPipelineOption} onClick={() => {
          if (!selectedPipelineOption) {
            return;
          }
          
          const selectedPipeline = pipelines.find(p => p.slug === selectedPipelineOption.value);
          
          if (!selectedPipeline) {
            return;
          }

          setGraph({ 
            ...graph, 
            metadata: { 
              ...graph.metadata, 
              attachedData: { 
                ...(graph.metadata?.attachedData ?? {}), 
                gentracePipeline: selectedPipeline
              } 
            } 
          });
          
          setSelectedPipeline(null);
          
          toast.info(`Saved Gentrace Pipeline: ${selectedPipelineOption.label}`, { autoClose: 4000 });
        }}>
          Save
        </button>
      </div>
    </div>
  );
};