import { GraphSelectorEditorDefinition, ChartNode, GraphId } from '@ironclad/rivet-core';
import { FC } from 'react';
import { SharedEditorProps } from './SharedEditorProps';
import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { orderBy, values } from 'lodash-es';
import { nanoid } from 'nanoid/non-secure';
import { useRecoilValue } from 'recoil';
import { projectState } from '../../state/savedGraphs';

export const DefaultGraphSelectorEditor: FC<
  SharedEditorProps & {
    editor: GraphSelectorEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

  return (
    <GraphSelector
      value={data[editor.dataKey] as string | undefined}
      isReadonly={isReadonly}
      onChange={(selected) =>
        onChange({
          ...node,
          data: {
            ...data,
            [editor.dataKey]: selected,
          },
        })
      }
      label={editor.label}
      name={editor.dataKey}
    />
  );
};

export const GraphSelector: FC<{
  value: string | undefined;
  name: string;
  label: string;
  isReadonly: boolean;
  onChange?: (selected: string) => void;
}> = ({ value, isReadonly, onChange, label, name }) => {
  const project = useRecoilValue(projectState);

  const graphOptions = orderBy(
    values(project.graphs).map((graph) => ({
      label: graph.metadata?.name ?? graph.metadata?.id ?? 'Unknown Graph',
      value: graph.metadata?.id ?? (nanoid() as GraphId),
    })),
    'label',
  );

  const selectedOption = graphOptions.find((option) => option.value === value);

  return (
    <Field name={name} label={label} isDisabled={isReadonly}>
      {({ fieldProps }) => (
        <Select
          {...fieldProps}
          options={graphOptions}
          value={selectedOption}
          onChange={(selected) => onChange?.(selected!.value)}
        />
      )}
    </Field>
  );
};
