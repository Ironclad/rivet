import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type TextNodeData,
  coerceTypeOptional,
  coerceType,
  type DataValue,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const TextNodeAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as TextNodeData;

  return (
    <AiAssistEditorBase<TextNodeData, { output: DataValue; response: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Text Node Generator"
      placeholder="Generate text using AI"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
        const outputText = coerceTypeOptional(outputs.output, 'string');

        if (outputText != null) {
          return {
            ...currentData,
            text: outputText,
          };
        }

        return null;
      }}
      getIsError={(outputs) => outputs.output == null || outputs.output.type === 'control-flow-excluded'}
      getErrorMessage={(outputs) => coerceType(outputs.response, 'string')}
      onSuccess={() => {
        toast.success('Text generated successfully!');
      }}
    />
  );
};
