import { type FC } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import {
  type ChartNode,
  type CustomEditorDefinition,
  type ObjectNodeData,
  coerceTypeOptional,
  type DataValue,
} from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { AiAssistEditorBase } from './AiAssistEditorBase';

export const ObjectNodeAiAssistEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as ObjectNodeData;

  return (
    <AiAssistEditorBase<ObjectNodeData, { object: DataValue; error: DataValue }>
      node={node}
      data={data}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      editor={editor}
      onChange={onChange}
      graphName="Object Node Generator"
      placeholder="What would you like your Object node to do?"
      label="Generate Using AI"
      updateData={(currentData, outputs) => {
        const object = coerceTypeOptional(outputs.object, 'string');

        if (object != null) {
          return {
            ...currentData,
            jsonTemplate: object,
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
        return errorResponse || 'Failed to generate object';
      }}
      onSuccess={() => {
        toast.success('Object generated successfully!');
      }}
    />
  );
};
