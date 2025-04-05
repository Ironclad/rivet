import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type GptFunctionNodeData,
  coerceTypeOptional,
  type DataValue,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const GptFunctionNodeJsonSchemaAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as GptFunctionNodeData;

  return (
    <AiAssistEditorBase<GptFunctionNodeData, { schema: DataValue; error: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Structured Outputs JSON Schema Generator"
      placeholder="What would you like your schema to be?"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
        const schema = coerceTypeOptional(outputs.schema, 'string');

        if (schema != null) {
          return {
            ...currentData,
            schema,
          };
        }

        return null;
      }}
      getIsError={(outputs) => {
        const errorResponse = coerceTypeOptional(outputs.error, 'string');
        return errorResponse != null;
      }}
      getErrorMessage={(outputs) => {
        const errorResponse = coerceTypeOptional(outputs.error, 'string');
        return errorResponse || 'Failed to generate schema';
      }}
      onSuccess={() => {
        toast.success('JSON Schema generated successfully!');
      }}
    />
  );
};
