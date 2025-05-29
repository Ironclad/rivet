import { useState, type FC, ReactNode } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  getError,
  type ChartNode,
  type CustomEditorDefinition,
  coreCreateProcessor,
  deserializeProject,
  ExecutionRecorder,
  registerBuiltInNodes,
  NodeRegistration,
  plugins as corePlugins,
} from '@ironclad/rivet-core';
import { Field } from '@atlaskit/form';
import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import Select from '@atlaskit/select';
import { toast } from 'react-toastify';
import codeGeneratorProject from '../../../../graphs/code-node-generator.rivet-project?raw';
import { useAtom, useAtomValue } from 'jotai';
import { settingsState } from '../../../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../../../utils/tauri';
import { useDependsOnPlugins } from '../../../hooks/useDependsOnPlugins';
import { marked } from 'marked';
import { syncWrapper } from '../../../utils/syncWrapper';
import { modelSelectorOptions } from '../../../utils/modelSelectorOptions';
import TextArea from '@atlaskit/textarea';
import { selectedAssistModelState } from '../../../state/ai';
import { BaseDirectory, createDir, writeFile } from '@tauri-apps/api/fs';

const styles = css`
  display: flex;
  align-items: center;
  gap: 8px;

  .model-and-button {
    width: 350px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
`;

export interface AiAssistEditorBaseProps<TNodeData, TOutputs> {
  node: ChartNode;
  data: TNodeData;
  isReadonly: boolean;
  isDisabled: boolean;
  editor: CustomEditorDefinition<ChartNode>;
  onChange: (node: ChartNode) => void;
  graphName: string;
  updateData: (data: TNodeData, result: TOutputs) => TNodeData | null;
  placeholder: string;
  label?: string;
  onError?: (error: any) => void;
  onSuccess?: (updatedNode: ChartNode) => void;
  getErrorMessage?: (outputs: TOutputs) => string;
  getIsError?: (outputs: TOutputs) => boolean;
}

export const AiAssistEditorBase = <TNodeData, TOutputs>({
  node,
  data,
  isReadonly,
  isDisabled,
  onChange,
  graphName,
  updateData,
  placeholder,
  label = 'Generate Using AI',
  onError,
  onSuccess,
  getErrorMessage,
  getIsError,
}: AiAssistEditorBaseProps<TNodeData, TOutputs>) => {
  const [prompt, setPrompt] = useState('');
  const [working, setWorking] = useState(false);

  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();

  const record = true;

  const [modelAndApi, setModelAndApi] = useAtom(selectedAssistModelState);

  const generate = async () => {
    try {
      const [project] = deserializeProject(codeGeneratorProject);
      const [api, model] = modelAndApi.split(':');

      const recorder = new ExecutionRecorder();

      const registry = registerBuiltInNodes(new NodeRegistration());
      registry.registerPlugin(corePlugins.anthropic);

      const processor = coreCreateProcessor(project, {
        graph: graphName,
        inputs: {
          prompt,
          model: model!,
          api: api!,
        },
        registry,
        ...(await fillMissingSettingsFromEnvironmentVariables(settings, plugins)),
      });

      if (record) {
        recorder.record(processor.processor);
      }

      setWorking(true);

      const outputs = (await processor.run()) as TOutputs;

      if (record) {
        const fileName = `recordings/${graphName.replace(/ /g, '-')}-${Date.now()}.rivet-recording`;

        await createDir('recordings', {
          dir: BaseDirectory.AppLog,
          recursive: true,
        });

        await writeFile(fileName, recorder.serialize(), {
          dir: BaseDirectory.AppLog,
        });
      }

      const isErrorResponse = getIsError ? getIsError(outputs) : false;

      if (!isErrorResponse) {
        const updatedData = updateData(data, outputs);

        if (updatedData) {
          const updatedNode = {
            ...node,
            data: updatedData,
          };

          onChange(updatedNode);

          // Call success callback if provided
          if (onSuccess) {
            onSuccess(updatedNode);
          }
        }
      } else {
        // Handle error response
        const responseText = getErrorMessage ? getErrorMessage(outputs) : 'An error occurred';

        const markdownResponse = marked(responseText);
        toast.info(<div dangerouslySetInnerHTML={{ __html: markdownResponse }}></div>, {
          autoClose: false,
          containerId: 'wide',
          toastId: 'ai-assist-response',
        });
      }
    } catch (err) {
      const error = getError(err);
      const errorMessage = `Failed to generate: ${error.message}`;
      toast.error(errorMessage);

      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setWorking(false);
    }
  };

  const selectedModel = modelSelectorOptions.find((option) => option.value === modelAndApi);

  return (
    <Field name="aiAssist" label={label}>
      {() => (
        <div css={styles}>
          <TextArea
            isDisabled={isDisabled || working}
            isReadOnly={isReadonly}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            className="text-area"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                generate();
              }
            }}
            minimumRows={3}
          />
          <div className="model-and-button">
            <Select
              options={modelSelectorOptions}
              value={selectedModel}
              onChange={(option) => setModelAndApi(option!.value)}
              isDisabled={isDisabled || working}
              className="model-selector"
            />
            <Button appearance="primary" onClick={syncWrapper(generate)} isDisabled={isDisabled || working}>
              Generate
            </Button>
          </div>
        </div>
      )}
    </Field>
  );
};
