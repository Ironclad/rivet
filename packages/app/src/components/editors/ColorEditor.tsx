import { Field } from '@atlaskit/form';
import { EditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { FC, Suspense } from 'react';
import { LazyTripleBarColorPicker } from '../LazyComponents';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultColorEditor: FC<
  SharedEditorProps & {
    editor: EditorDefinition<ChartNode>;
  }
> = ({ node, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

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
        )}
      </Field>
    </Suspense>
  );
};
