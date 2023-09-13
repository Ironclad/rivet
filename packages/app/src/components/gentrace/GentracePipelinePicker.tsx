import Portal from '@atlaskit/portal';
import Select from '@atlaskit/select';
import { css } from '@emotion/react';
import { FC, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { getGentracePipelines } from '../../../../core/src/plugins/gentrace/plugin';
import { graphState } from '../../state/graph';
import { settingsState } from '../../state/settings';

type GentracePipelinePickerProps = {
  onClose: () => void;
}

type ArrayType<T> = T extends Array<infer U> ? U : never;
export type GentracePipeline = ArrayType<Awaited<ReturnType<typeof getGentracePipelines>>>

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

export default GentracePipelinePicker;