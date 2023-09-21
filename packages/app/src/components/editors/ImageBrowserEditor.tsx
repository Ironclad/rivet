import Button from '@atlaskit/button';
import { Field } from '@atlaskit/form';
import { ImageBrowserEditorDefinition, ChartNode, DataId, uint8ArrayToBase64, DataRef } from '@ironclad/rivet-core';
import { nanoid } from 'nanoid/non-secure';
import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';
import { ioProvider } from '../../utils/globals';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultImageBrowserEditor: FC<
  SharedEditorProps & {
    editor: ImageBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

  const dataState = useRecoilValue(projectDataState);

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
  const b64Data = dataRef ? dataState?.[dataRef.refId] : undefined;
  const mediaType = b64Data ? (data[editor.mediaTypeDataKey] as string | undefined) : undefined;

  const dataUri = b64Data ? `data:${mediaType ?? 'image/png'};base64,${b64Data}` : undefined;

  return (
    <Field name={editor.dataKey} label={editor.label}>
      {() => (
        <div>
          <Button onClick={pickFile}>Pick Image</Button>
          <div className="current">
            <img src={dataUri} alt="" />
          </div>
        </div>
      )}
    </Field>
  );
};
