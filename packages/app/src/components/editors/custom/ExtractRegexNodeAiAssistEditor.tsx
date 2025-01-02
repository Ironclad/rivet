import { useState, type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  getError,
  type ChartNode,
  type CustomEditorDefinition,
  coreCreateProcessor,
  deserializeProject,
  coerceType,
  coerceTypeOptional,
  type ExtractRegexNodeData,
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

export const ExtractRegexNodeAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const [prompt, setPrompt] = useState('');
  const [working, setWorking] = useState(false);
  const [model, setModel] = useState('gpt-4o-mini');

  const settings = useAtomValue(settingsState);
  const plugins = useDependsOnPlugins();

  const data = node.data as ExtractRegexNodeData;

  const generateRegex = async () => {
    try {
      const [project] = deserializeProject(codeGeneratorProject);
      const processor = coreCreateProcessor(project, {
        graph: 'Extract Regex Node Generator',
        inputs: {
          prompt,
          model,
        },
        ...(await fillMissingSettingsFromEnvironmentVariables(settings, plugins)),
      });

      setWorking(true);

      const outputs = await processor.run();
      const regex = coerceTypeOptional(outputs.regex, 'string');
      const multiline = coerceTypeOptional(outputs.multiline, 'boolean');

      if (regex != null) {
        onChange({
          ...node,
          data: {
            ...data,
            regex,
            multilineMode: multiline,
          } satisfies ExtractRegexNodeData,
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
      toast.error(`Failed to generate regex: ${getError(err).message}`);
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
            placeholder="What would you like your Extract Regex node to do?"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                generateRegex();
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
          <Button appearance="primary" onClick={generateRegex} isDisabled={isDisabled || working}>
            Generate
          </Button>
        </div>
      )}
    </Field>
  );
};
