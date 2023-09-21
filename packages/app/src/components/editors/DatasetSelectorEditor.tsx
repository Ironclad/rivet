import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { DatasetSelectorEditorDefinition, ChartNode } from '@ironclad/rivet-core';
import { orderBy } from 'lodash-es';
import { FC } from 'react';
import { useRecoilValue } from 'recoil';
import { useDatasets } from '../../hooks/useDatasets';
import { projectState } from '../../state/savedGraphs';
import { SharedEditorProps } from './SharedEditorProps';

export const DefaultDatasetSelectorEditor: FC<
  SharedEditorProps & {
    editor: DatasetSelectorEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

  return (
    <DatasetSelector
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

export const DatasetSelector: FC<{
  value: string | undefined;
  name: string;
  label: string;
  isReadonly: boolean;
  onChange?: (selected: string) => void;
}> = ({ value, isReadonly, onChange, label, name }) => {
  const project = useRecoilValue(projectState);
  const { datasets } = useDatasets(project.metadata.id);

  const datasetOptions = orderBy(
    datasets?.map((dataset) => ({
      label: dataset.name,
      value: dataset.id,
    })) ?? [],
    'label',
  );

  const selectedOption = datasetOptions.find((option) => option.value === value);

  return (
    <Field name={name} label={label} isDisabled={isReadonly}>
      {({ fieldProps }) => (
        <Select
          {...fieldProps}
          options={datasetOptions}
          value={selectedOption}
          onChange={(selected) => onChange?.(selected!.value)}
        />
      )}
    </Field>
  );
};
