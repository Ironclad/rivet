import Portal from '@atlaskit/portal';
import Select from '@atlaskit/select';
import { css } from '@emotion/react';
import { type FC, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { getGentracePipelines } from '../../../../core/src/plugins/gentrace/plugin';
import { graphState } from '../../state/graph';
import { settingsState } from '../../state/settings';

type GentracePipelinePickerProps = {
  onClose: () => void;
};

type ArrayType<T> = T extends Array<infer U> ? U : never;
export type GentracePipeline = ArrayType<Awaited<ReturnType<typeof getGentracePipelines>>>;

const pickerContainerStyles = css`
  background-color: var(--grey-darkish);
  border-radius: 4px;
  border: 1px solid var(--grey-dark);
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  min-width: 400px;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const GentracePipelinePicker: FC<GentracePipelinePickerProps> = ({ onClose }) => {
  const savedSettings = useRecoilValue(settingsState);

  const [graph, setGraph] = useRecoilState(graphState);

  const gentracePipelineSettings = graph?.metadata?.attachedData?.gentracePipeline as GentracePipeline | undefined;
  const currentGentracePipelineSlug = gentracePipelineSettings?.slug;

  const gentraceApiKey = savedSettings.pluginSettings?.gentrace?.gentraceApiKey as string | undefined;

  const [pipelines, setPipelines] = useState<GentracePipeline[]>([]);

  const [selectedPipelineOption, setSelectedPipeline] = useState<{ label: string; value: string } | null>(null);

  useEffect(() => {
    if (!gentraceApiKey) {
      return;
    }

    (async () => {
      try {
        const pipelines = await getGentracePipelines(gentraceApiKey);
        setPipelines(pipelines);
      } catch (e: any) {
        const serverResult = e?.response?.data?.message ?? e?.message;
        toast.error(`Error loading Gentrace pipelines: ${serverResult}`);
      }
    })();
  }, [gentraceApiKey]);

  const dropdownTarget = useRef<HTMLDivElement>(null);

  const pipelineOptions = pipelines.map((p) => ({
    label: p.displayName ?? p.slug,
    value: p.slug,
  }));

  const currentOption = pipelineOptions.find((o) => o.value === currentGentracePipelineSlug);

  const effectiveSelectedPipeline = selectedPipelineOption ?? currentOption ?? pipelineOptions[0] ?? null;

  const onAssociate = () => {
    if (!selectedPipelineOption) {
      return;
    }

    const selectedPipeline = pipelines.find((p) => p.slug === selectedPipelineOption.value);

    if (!selectedPipeline) {
      return;
    }

    const { cases, ...selectedPipelineNoCases } = selectedPipeline;

    setGraph({
      ...graph,
      metadata: {
        ...graph.metadata,
        attachedData: {
          ...(graph.metadata?.attachedData ?? {}),
          gentracePipeline: selectedPipelineNoCases,
        },
      },
    });

    setSelectedPipeline(null);

    toast.info(`Associated Gentrace pipeline: ${selectedPipelineOption.label}`, { autoClose: 4000 });
  };

  return (
    <div css={pickerContainerStyles}>
      <Portal zIndex={1000}>
        <div ref={dropdownTarget} />
      </Portal>

      <div
        css={css`
          margin-bottom: 10px;
          font-weight: 500;
          font-size: 15px;
        `}
      >
        Select Gentrace Pipeline
      </div>

      <div
        css={css`
          margin-bottom: 10px;
        `}
      >
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

      <div
        css={css`
          margin-bottom: 20px;
        `}
      >
        <button
          css={css`
            border: none;
            padding: 0.5rem 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0px;
            height: 32px;
            border-radius: 5px;
            background: ${selectedPipelineOption ? 'var(--success)' : 'var(--grey-darker)'};
          `}
          disabled={!selectedPipelineOption}
          onClick={onAssociate}
        >
          Associate
        </button>
      </div>

      <div>
        Need a new pipeline?{' '}
        <a href="https://gentrace.ai/pipeline/new" target="_blank" rel="noreferrer">
          Create one here.
        </a>
      </div>
    </div>
  );
};

export default GentracePipelinePicker;
