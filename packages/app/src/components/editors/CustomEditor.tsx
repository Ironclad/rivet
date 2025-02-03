import { type CustomEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { match } from 'ts-pattern';
import { CodeNodeAIAssistEditor } from './custom/CodeNodeAIAssistEditor';
import { ToolCallHandlersEditor } from './custom/ToolCallHandlersEditor';
import { ExtractRegexNodeAiAssistEditor } from './custom/ExtractRegexNodeAiAssistEditor';
import { ObjectNodeAiAssistEditor } from './custom/ObjectNodeAiAssistEditor';
import { GptFunctionNodeJsonSchemaAiAssistEditor } from './custom/GptFunctionJsonSchemaAiAssistEditor';
import { PromptNodeAiAssistEditor } from './custom/PromptNodeAiAssistEditor';
import { TextNodeAiAssistEditor } from './custom/TextNodeAiAssistEditor';

export const CustomEditor: FC<
  SharedEditorProps & {
    editor: CustomEditorDefinition<ChartNode>;
  }
> = ({ editor, ...props }) => {
  return match(editor.customEditorId)
    .with('CodeNodeAIAssist', () => <CodeNodeAIAssistEditor {...props} editor={editor} />)
    .with('ToolCallHandlers', () => <ToolCallHandlersEditor {...props} editor={editor} />)
    .with('ExtractRegexNodeAiAssist', () => <ExtractRegexNodeAiAssistEditor {...props} editor={editor} />)
    .with('ObjectNodeAiAssist', () => <ObjectNodeAiAssistEditor {...props} editor={editor} />)
    .with('GptFunctionNodeJsonSchemaAiAssist', () => (
      <GptFunctionNodeJsonSchemaAiAssistEditor {...props} editor={editor} />
    ))
    .with('PromptNodeAiAssist', () => <PromptNodeAiAssistEditor {...props} editor={editor} />)
    .with('TextNodeAiAssist', () => <TextNodeAiAssistEditor {...props} editor={editor} />)
    .otherwise(() => null);
};
