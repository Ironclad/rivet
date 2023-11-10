import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import {
  type FileBrowserEditorDefinition,
  type ChartNode,
  type DataId,
  uint8ArrayToBase64,
  type DataRef,
  type FilePathBrowserEditorDefinition,
} from '@ironclad/rivet-core';
import { nanoid } from 'nanoid/non-secure';
import prettyBytes from 'pretty-bytes';
import { type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';
import { ioProvider } from '../../utils/globals';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultFileBrowserEditor: FC<
  SharedEditorProps & {
    editor: FileBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const projectData = useRecoilValue(projectDataState);
  const helperMessage = getHelperMessage(editor, node.data);

  const pickFile = async () => {
    await ioProvider.readFileAsBinary(async (binaryData) => {
      const dataId = nanoid() as DataId;
      onChange(
        {
          ...node,
          data: {
            ...data,
            [editor.dataKey]: {
              refId: dataId,
            } satisfies DataRef,
          },
        },
        {
          [dataId]: (await uint8ArrayToBase64(binaryData)) ?? '',
        },
      );
    });
  };

  const dataRef = data[editor.dataKey] as DataRef | undefined;
  const b64Data = dataRef ? projectData?.[dataRef.refId] : undefined;

  const dataUri = b64Data ? `data:base64,${b64Data}` : undefined;
  const dataByteLength = b64Data ? Math.round(b64Data.length * 0.75) : undefined;

  return (
    <Field name={editor.dataKey} label={editor.label}>
      {() => (
        <div>
          <Button onClick={pickFile} isDisabled={isReadonly || isDisabled}>
            Pick File
          </Button>
          <div className="current">{dataUri && <span>Data ({prettyBytes(dataByteLength ?? NaN)})</span>}</div>
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </div>
      )}
    </Field>
  );
};

export const DefaultFilePathBrowserEditor: FC<
  SharedEditorProps & {
    editor: FilePathBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);

  const pickFile = async () => {
    const path = await ioProvider.openFilePath();
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
          <Button onClick={pickFile} isDisabled={isReadonly || isDisabled}>
            Pick File
          </Button>
          <div className="current">{data[editor.dataKey] != null && <span>{data[editor.dataKey] as string}</span>}</div>
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </div>
      )}
    </Field>
  );
};
