import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import { FileBrowserEditorDefinition, ChartNode, DataId, uint8ArrayToBase64, DataRef } from '@ironclad/rivet-core';
import { nanoid } from 'nanoid/non-secure';
import prettyBytes from 'pretty-bytes';
import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';
import { ioProvider } from '../../utils/globals';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultFileBrowserEditor: FC<
  SharedEditorProps & {
    editor: FileBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const projectData = useRecoilValue(projectDataState);

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
          <Button onClick={pickFile}>Pick File</Button>
          <div className="current">{dataUri && <span>Data ({prettyBytes(dataByteLength ?? NaN)})</span>}</div>
        </div>
      )}
    </Field>
  );
};
