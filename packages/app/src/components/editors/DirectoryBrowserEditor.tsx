import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import { type ChartNode, type DirectoryBrowserEditorDefinition } from '@ironclad/rivet-core';
import { type FC } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';
import { ioProvider } from '../../utils/globals';
import { syncWrapper } from '../../utils/syncWrapper';

export const DefaultDirectoryBrowserEditor: FC<
  SharedEditorProps & {
    editor: DirectoryBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);

  const pickDirectory = async () => {
    const path = await ioProvider.openDirectory();
    if (path) {
      onChange({
        ...node,
        data: {
          ...data,
          [editor.dataKey]: path as string,
        },
      });
    }
  };

  return (
    <Field name={editor.dataKey} label={editor.label}>
      {() => (
        <div>
          <Button onClick={syncWrapper(pickDirectory)} isDisabled={isReadonly || isDisabled}>
            Pick Directory
          </Button>
          <div className="current">{data[editor.dataKey] != null && <span>{data[editor.dataKey] as string}</span>}</div>
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </div>
      )}
    </Field>
  );
};
