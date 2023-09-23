import { Field, HelperMessage } from '@atlaskit/form';
import { type ChartNode, type ColorEditorDefinition } from '@ironclad/rivet-core';
import { type FC, Suspense } from 'react';
import { LazyTripleBarColorPicker } from '../LazyComponents';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultColorEditor: FC<
  SharedEditorProps & {
    editor: ColorEditorDefinition<ChartNode>;
  }
> = ({ node, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);

  const parsed = /rgba\((?<rStr>\d+),(?<gStr>\d+),(?<bStr>\d+),(?<aStr>[\d.]+)\)/.exec(data[editor.dataKey] as string);

  const { rStr, gStr, bStr, aStr } = parsed ? parsed.groups! : { rStr: '0', gStr: '0', bStr: '0', aStr: '0' };

  const { r, g, b, a } = {
    r: parseInt(rStr!, 10),
    g: parseInt(gStr!, 10),
    b: parseInt(bStr!, 10),
    a: parseFloat(aStr!),
  };

  return (
    <Suspense fallback={<div />}>
      <Field name={editor.dataKey} label={editor.label}>
        {() => (
          <>
            <LazyTripleBarColorPicker
              color={{ r, g, b, a }}
              onChange={(newColor) => {
                onChange({
                  ...node,
                  data: {
                    ...data,
                    [editor.dataKey]: `rgba(${newColor.rgb.r},${newColor.rgb.g},${newColor.rgb.b},${newColor.rgb.a})`,
                  },
                });
              }}
            />
            {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
          </>
        )}
      </Field>
    </Suspense>
  );
};
