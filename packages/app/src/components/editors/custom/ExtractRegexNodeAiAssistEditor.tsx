import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type ExtractRegexNodeData,
  coerceTypeOptional,
  coerceType,
  type DataValue,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const ExtractRegexNodeAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as ExtractRegexNodeData;

  return (
    <AiAssistEditorBase<ExtractRegexNodeData, { regex: DataValue; multiline: DataValue; response: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Extract Regex Node Generator"
      placeholder="What would you like your Extract Regex node to do?"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
        const regex = coerceTypeOptional(outputs.regex, 'string');
        const multiline = coerceTypeOptional(outputs.multiline, 'boolean');

        if (regex != null) {
          return {
            ...currentData,
            regex,
            multilineMode: multiline,
          };
        }

        return null;
      }}
      getIsError={(outputs) => outputs.regex == null || outputs.regex.type === 'control-flow-excluded'}
      getErrorMessage={(outputs) => coerceType(outputs.response, 'string')}
      onSuccess={() => {
        toast.success('Regex generated successfully!');
      }}
    />
  );
};
