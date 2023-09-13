import Popup from '@atlaskit/popup';
import { globalRivetNodeRegistry } from '@ironclad/rivet-core';
import { useToggle } from 'ahooks';
import clsx from 'clsx';
import { ReactComponent as EditPen } from 'majesticons/line/edit-pen-2-line.svg';
import { ReactComponent as TestTube } from 'majesticons/line/test-tube-filled-line.svg';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';
import { runGentraceTests } from '../../../../core/src/plugins/gentrace/plugin';
import { TauriNativeApi } from '../../model/native/TauriNativeApi';
import { graphState } from '../../state/graph';
import { projectState } from '../../state/savedGraphs.js';
import { settingsState } from '../../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../../utils/tauri';
import gentraceImage from '../../assets/node_images/gentrace.svg';
import GentracePipelinePicker, { GentracePipeline } from './GentracePipelinePicker';

const GentraceInteractors = () => {
  const project = useRecoilValue(projectState);
  const graph = useRecoilValue(graphState);
  const savedSettings = useRecoilValue(settingsState);
  
  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

  const [gentracePipelineSelectorOpen, toggleGentracePipelineSelectorOpen] = useToggle(false);

  return (
    <>
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
    </>
  );
};

export default GentraceInteractors;