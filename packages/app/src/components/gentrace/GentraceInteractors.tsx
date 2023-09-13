import Popup from '@atlaskit/popup';
import { css } from '@emotion/react';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useToggle } from 'ahooks';
import clsx from 'clsx';
import { ReactComponent as EditPen } from 'majesticons/line/edit-pen-2-line.svg';
import { ReactComponent as TestTube } from 'majesticons/line/test-tube-filled-line.svg';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';
import { runGentraceTests } from '../../../../core/src/plugins/gentrace/plugin';
import { ReactComponent as GentraceImage } from '../../assets/vendor_logos/gentrace.svg';
import { TauriNativeApi } from '../../model/native/TauriNativeApi';
import { graphState } from '../../state/graph';
import { projectState } from '../../state/savedGraphs.js';
import { settingsState } from '../../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../../utils/tauri';
import GentracePipelinePicker, { GentracePipeline } from './GentracePipelinePicker';

export const GentraceInteractors = () => {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const savedSettings = useRecoilValue(settingsState);
  
  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

  const [gentracePipelineSelectorOpen, toggleGentracePipelineSelectorOpen] = useToggle(false);
  
  const onRun = async () => {
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
      const serverResult = e?.response?.data?.message ?? e?.message;
      toast.error((
        <div>
          <div css={css`
            margin-bottom: 10px; 
          `}>
            Error running Gentrace pipeline {currentGentracePipelineSlug} tests: 
          </div>
          
          <div>
            <code css={css`
              font-size: 12px;
            `}>
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
  };

  return (
    <>
      <Popup
        isOpen={gentracePipelineSelectorOpen}
        onClose={toggleGentracePipelineSelectorOpen.setLeft}
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
              {currentGentracePipelineSlug ? "Change" : "Add"} Gentrace Pipeline
              <EditPen />
            </button>
          </div>
        )}
      />

      <div className={clsx('run-gentrace-button')}>
        <button onClick={onRun} css={`` }>
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