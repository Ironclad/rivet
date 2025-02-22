import { useState, type FC, useMemo } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  getError,
  type ChartNode,
  type CustomEditorDefinition,
  coreCreateProcessor,
  deserializeProject,
  type CodeNodeData,
  coerceType,
  coerceTypeOptional,
} from '@ironclad/rivet-core';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { css } from '@emotion/react';
import Select from '@atlaskit/select';
import { toast } from 'react-toastify';
import codeGeneratorProject from '../../../../graphs/code-node-generator.rivet-project?raw';
import { useAtomValue } from 'jotai';
import { settingsState } from '../../../state/settings';
import { fillMissingSettingsFromEnvironmentVariables } from '../../../utils/tauri';
import { useDependsOnPlugins } from '../../../hooks/useDependsOnPlugins';
import { marked } from 'marked';
import { syncWrapper } from '../../../utils/syncWrapper';

const styles = css`
  display: flex;
  align-items: center;
  gap: 8px;

  .model-selector {
    width: 250px;
  }
`;

const modelOptions = [
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
];

export const CodeNodeAIAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const [prompt, setPrompt] = useState('');
  const [working, setWorking] = useState(false);
  const [model, setModel] = useState('gpt-4o-mini');

  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();

  const data = node.data as CodeNodeData;

  const generateCode = async () => {
    try {
      const [project] = deserializeProject(codeGeneratorProject);
      const processor = coreCreateProcessor(project, {
        graph: 'Code Node Generator',
        inputs: {
          prompt,
          model,
        },
        ...(await fillMissingSettingsFromEnvironmentVariables(settings, plugins)),
      });

      setWorking(true);

      const outputs = await processor.run();
      const code = coerceTypeOptional(outputs.code, 'string');
      const configuration = coerceTypeOptional(outputs.configuration, 'object') as {
        inputs: string[];
        outputs: string[];
        allowFetch: boolean;
        allowRequire: boolean;
        allowProcess: boolean;
        allowRivet: boolean;
      };

      if (code) {
        onChange({
          ...node,
          data: {
            ...data,
            code,
            inputNames: configuration.inputs,
            outputNames: configuration.outputs,
            allowFetch: configuration.allowFetch,
            allowRequire: configuration.allowRequire,
            allowProcess: configuration.allowProcess,
            allowRivet: configuration.allowRivet,
          } satisfies CodeNodeData,
        });
      } else {
        const markdownResponse = marked(coerceType(outputs.response, 'string'));
        toast.info(<div dangerouslySetInnerHTML={{ __html: markdownResponse }}></div>, {
          autoClose: false,
          containerId: 'wide',
          toastId: 'ai-assist-response',
        });
      }
    } catch (err) {
      toast.error(`Failed to generate code: ${getError(err).message}`);
    } finally {
      setWorking(false);
    }
  };

  const selectedModel = modelOptions.find((option) => option.value === model);

  return (
    <Field name="aiAssist" label="Generate Using AI">
      {() => (
        <div css={styles}>
          <TextField
            isDisabled={isDisabled || working}
            isReadOnly={isReadonly}
            value={prompt}
            onChange={(e) => setPrompt((e.target as HTMLInputElement).value)}
            placeholder="What would you like your code node to do?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                generateCode();
              }
            }}
          />
          <Select
            options={modelOptions}
            value={selectedModel}
            onChange={(option) => setModel(option!.value)}
            isDisabled={isDisabled || working}
            className="model-selector"
          />
          <Button appearance="primary" onClick={syncWrapper(generateCode)} isDisabled={isDisabled || working}>
            Generate
          </Button>
        </div>
      )}
    </Field>
  );
};
