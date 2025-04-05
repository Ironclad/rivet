import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type CodeNodeData,
  coerceTypeOptional,
  type DataValue,
  coerceType,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const CodeNodeAIAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as CodeNodeData;

  return (
    <AiAssistEditorBase<CodeNodeData, { code: DataValue; response: DataValue; configuration: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Code Node Generator"
      placeholder="What would you like your code node to do?"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
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
          return {
            ...currentData,
            code,
            inputNames: configuration.inputs,
            outputNames: configuration.outputs,
            allowFetch: configuration.allowFetch,
            allowRequire: configuration.allowRequire,
            allowProcess: configuration.allowProcess,
            allowRivet: configuration.allowRivet,
          };
        }

        return null;
      }}
      getIsError={(outputs) => outputs.code == null || outputs.code.type === 'control-flow-excluded'}
      getErrorMessage={(outputs) => coerceType(outputs.response, 'string')}
      onSuccess={() => {
        toast.success('Code generated successfully!');
      }}
    />
  );
};
