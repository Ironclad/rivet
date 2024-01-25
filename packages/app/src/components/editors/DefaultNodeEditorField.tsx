import Toggle from '@atlaskit/toggle';
import { type EditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import clsx from 'clsx';
import { type FC } from 'react';
import { match } from 'ts-pattern';
import { type SharedEditorProps } from './SharedEditorProps';
import { DefaultAnyDataEditor } from './AnyEditor';
import { DefaultCodeEditor } from './CodeEditor';
import { DefaultColorEditor } from './ColorEditor';
import { DefaultDataTypeSelector } from './DataTypeEditor';
import { DefaultDatasetSelectorEditor } from './DatasetSelectorEditor';
import { DefaultDropdownEditor } from './DropdownEditor';
import { DefaultFileBrowserEditor, DefaultFilePathBrowserEditor } from './FileBrowserEditor';
import { DefaultGraphSelectorEditor } from './GraphSelectorEditor';
import { DefaultImageBrowserEditor } from './ImageBrowserEditor';
import { DefaultNumberEditor } from './NumberEditor';
import { DefaultStringEditor } from './StringEditor';
import { DefaultToggleEditor } from './ToggleEditor';
// eslint-disable-next-line import/no-cycle
import { EditorGroup } from './EditorGroup';
import { KeyValuePairEditor } from './KeyValuePairEditor';
import { StringListEditor } from './StringListEditor';
import { CustomEditor } from './CustomEditor';
import { DefaultDynamicEditor } from './DynamicEditor';
import { Tooltip } from '../Tooltip';

export const DefaultNodeEditorField: FC<
  SharedEditorProps & {
    editor: EditorDefinition<ChartNode>;
  }
> = ({ node, onChange, editor, isReadonly, isDisabled, onClose }) => {
  const data = node.data as Record<string, unknown>;

  if (editor.hideIf?.(node.data)) {
    return null;
  }

  const sharedProps: SharedEditorProps = {
    node,
    onChange,
    isReadonly,
    onClose,
    isDisabled,
  };

  const input = match(editor)
    .with({ type: 'string' }, (editor) => <DefaultStringEditor {...sharedProps} editor={editor} />)
    .with({ type: 'toggle' }, (editor) => <DefaultToggleEditor {...sharedProps} editor={editor} />)
    .with({ type: 'dataTypeSelector' }, (editor) => <DefaultDataTypeSelector {...sharedProps} editor={editor} />)
    .with({ type: 'anyData' }, (editor) => <DefaultAnyDataEditor {...sharedProps} editor={editor} />)
    .with({ type: 'dropdown' }, (editor) => <DefaultDropdownEditor {...sharedProps} editor={editor} />)
    .with({ type: 'number' }, (editor) => <DefaultNumberEditor {...sharedProps} editor={editor} />)
    .with({ type: 'code' }, (editor) => <DefaultCodeEditor {...sharedProps} editor={editor} />)
    .with({ type: 'graphSelector' }, (editor) => <DefaultGraphSelectorEditor {...sharedProps} editor={editor} />)
    .with({ type: 'datasetSelector' }, (editor) => <DefaultDatasetSelectorEditor {...sharedProps} editor={editor} />)
    .with({ type: 'color' }, (editor) => <DefaultColorEditor {...sharedProps} editor={editor} />)
    .with({ type: 'fileBrowser' }, (editor) => <DefaultFileBrowserEditor {...sharedProps} editor={editor} />)
    .with({ type: 'imageBrowser' }, (editor) => <DefaultImageBrowserEditor {...sharedProps} editor={editor} />)
    .with({ type: 'group' }, (editor) => <EditorGroup {...sharedProps} editor={editor} />)
    .with({ type: 'keyValuePair' }, (editor) => <KeyValuePairEditor {...sharedProps} editor={editor} />)
    .with({ type: 'stringList' }, (editor) => <StringListEditor {...sharedProps} editor={editor} />)
    .with({ type: 'custom' }, (editor) => <CustomEditor {...sharedProps} editor={editor} />)
    .with({ type: 'dynamic' }, (editor) => <DefaultDynamicEditor {...sharedProps} editor={editor} />)
    .with({ type: 'filePathBrowser' }, (editor) => <DefaultFilePathBrowserEditor {...sharedProps} editor={editor} />)
    .exhaustive();

  const toggle =
    editor.type !== 'group' && editor.useInputToggleDataKey ? (
      <div className="use-input-toggle">
        <Tooltip content={`Use an input port for ${editor.label}`}>
          <Toggle
            isChecked={data[editor.useInputToggleDataKey] as boolean | undefined}
            isDisabled={isReadonly || sharedProps.isDisabled}
            onChange={(e) =>
              onChange({
                ...node,
                data: {
                  ...data,
                  [editor.useInputToggleDataKey!]: e.target.checked,
                },
              })
            }
          />
        </Tooltip>
      </div>
    ) : (
      <div />
    );

  const style = editor.type === 'code' && editor.height != null ? { minHeight: editor.height } : {};

  return (
    <div className={clsx('row', editor.type)} style={style}>
      {input}
      {toggle}
    </div>
  );
};
