import Popup from '@atlaskit/popup';
import { css } from '@emotion/react';
import { type DataValue, ExecutionRecorder, globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useToggle } from 'ahooks';
import clsx from 'clsx';
import EditPen from 'majesticons/line/edit-pen-2-line.svg?react';
import TestTube from 'majesticons/line/test-tube-filled-line.svg?react';
import GentraceImage from '../../assets/vendor_logos/gentrace.svg?react';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';
import { runGentraceTests, runRemoteGentraceTests } from '../../../../core/src/plugins/gentrace/plugin';
import { useRemoteDebugger } from '../../hooks/useRemoteDebugger';
import { useRemoteExecutor } from '../../hooks/useRemoteExecutor';
import { TauriNativeApi } from '../../model/native/TauriNativeApi';
import { graphState } from '../../state/graph';
import { projectContextState, projectDataState, projectState } from '../../state/savedGraphs.js';
import { settingsState } from '../../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../../utils/tauri';
import GentracePipelinePicker, { type GentracePipeline } from './GentracePipelinePicker';
import { entries } from '../../../../core/src/utils/typeSafety';

export const GentraceInteractors = () => {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const savedSettings = useRecoilValue(settingsState);
  const projectData = useRecoilValue(projectDataState);
  const projectContext = useRecoilValue(projectContextState(project.metadata.id));

  const remoteDebugger = useRemoteDebugger();

  const remoteExecutor = useRemoteExecutor();

  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

  const [gentracePipelineSelectorOpen, toggleGentracePipelineSelectorOpen] = useToggle(false);

  const onRun = async () => {
    const settings = await fillMissingSettingsFromEnvironmentVariables(
      savedSettings,
      globalRivetNodeRegistry.getPlugins(),
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
      if (remoteExecutor.active && remoteDebugger.remoteDebuggerState.socket) {
        const testResponse = await runRemoteGentraceTests(
          currentGentracePipelineSlug,
          settings,
          project,
          graph,
          async (inputs) => {
            if (remoteDebugger.remoteDebuggerState.remoteUploadAllowed) {
              remoteDebugger.send('set-dynamic-data', {
                project: {
                  ...project,
                  graphs: {
                    ...project.graphs,
                    [graph.metadata!.id!]: graph,
                  },
                },
                settings: await fillMissingSettingsFromEnvironmentVariables(
                  savedSettings,
                  globalRivetNodeRegistry.getPlugins(),
                ),
              });
            }

            const recorder = new ExecutionRecorder();

            const recorderPromise = recorder.recordSocket(remoteDebugger.remoteDebuggerState.socket!);

            const contextValues = entries(projectContext).reduce(
              (acc, [key, value]) => ({
                ...acc,
                [key]: value.value,
              }),
              {} as Record<string, DataValue>,
            );

            remoteDebugger.send('run', { graphId: graph.metadata!.id!, inputs, contextValues });

            await recorderPromise;

            return recorder.getRecording();
          },
        );
        testResultId = testResponse.resultId;
      } else {
        const testResponse = await runGentraceTests(
          currentGentracePipelineSlug,
          settings,
          project,
          graph,
          new TauriNativeApi(),
        );
        testResultId = testResponse.resultId;
      }
    } catch (e: any) {
      const serverResult = e?.response?.data?.message ?? e?.message;
      toast.error(
        <div>
          <div
            css={css`
              margin-bottom: 10px;
            `}
          >
            Error running Gentrace pipeline {currentGentracePipelineSlug} tests:
          </div>

          <div>
            <code
              css={css`
                font-size: 12px;
              `}
            >
              {serverResult}
            </code>
          </div>
        </div>,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        },
      );
      return;
    }

    const url = `http://gentrace.ai/pipeline/${gentracePipelineSettings.id}/results/${testResultId}?size=compact`;

    toast.info(
      <div>
        <div>Gentrace pipeline {currentGentracePipelineSlug} tests finished.</div>
        <div>
          View results here{' '}
          <a href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      },
    );
  };

  return (
    <>
      <Popup
        isOpen={gentracePipelineSelectorOpen}
        onClose={toggleGentracePipelineSelectorOpen.setLeft}
        content={() => <GentracePipelinePicker onClose={toggleGentracePipelineSelectorOpen.setLeft} />}
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
              css={css`
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
              `}
            >
              <div>
                <GentraceImage height="17px" width="17px" />
              </div>
              {currentGentracePipelineSlug ? 'Change' : 'Add'} Gentrace Pipeline
              <EditPen />
            </button>
          </div>
        )}
      />

      <div className={clsx('run-gentrace-button')}>
        <button onClick={onRun} css={``}>
          <div>
            <GentraceImage height="17px" width="17px" />
          </div>
          Run Gentrace Tests
          <TestTube />
        </button>
      </div>
    </>
  );
};
