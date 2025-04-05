import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type PromptNodeData,
  coerceTypeOptional,
  coerceType,
  type DataValue,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const PromptNodeAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as PromptNodeData;

  return (
    <AiAssistEditorBase<PromptNodeData, { output: DataValue; response: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Prompt Node Generator"
      placeholder="Generate a prompt using AI"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
        const outputPrompt = coerceTypeOptional(outputs.output, 'string');

        if (outputPrompt != null) {
          return {
            ...currentData,
            promptText: outputPrompt,
          };
        }

        return null;
      }}
      getIsError={(outputs) => outputs.output == null || outputs.output.type === 'control-flow-excluded'}
      getErrorMessage={(outputs) => coerceType(outputs.response, 'string')}
      onSuccess={() => {
        toast.success('Prompt generated successfully!');
      }}
    />
  );
};
