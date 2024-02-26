import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import {
  type ImageBrowserEditorDefinition,
  type ChartNode,
  type DataId,
  uint8ArrayToBase64,
  type DataRef,
} from '@ironclad/rivet-core';
import { nanoid } from 'nanoid/non-secure';
import { type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { projectDataState } from '../../state/savedGraphs';
import { ioProvider } from '../../utils/globals';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultImageBrowserEditor: FC<
  SharedEditorProps & {
    editor: ImageBrowserEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);

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
          <Button onClick={pickFile} isDisabled={isReadonly || isDisabled}>
            Pick Image
          </Button>
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}

          <div className="current">
            <img src={dataUri} alt="" />
          </div>
        </div>
      )}
    </Field>
  );
};
