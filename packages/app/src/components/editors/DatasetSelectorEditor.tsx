import { Field, HelperMessage } from '@atlaskit/form';
import Select from '@atlaskit/select';
import { type DatasetSelectorEditorDefinition, type ChartNode } from '@ironclad/rivet-core';
import { orderBy } from 'lodash-es';
import { type FC } from 'react';
import { useRecoilValue } from 'recoil';
import { useDatasets } from '../../hooks/useDatasets';
import { projectState } from '../../state/savedGraphs';
import { type SharedEditorProps } from './SharedEditorProps';
import { getHelperMessage } from './editorUtils';

export const DefaultDatasetSelectorEditor: FC<
  SharedEditorProps & {
    editor: DatasetSelectorEditorDefinition<ChartNode>;
  }
> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);

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
      isDisabled={isDisabled}
      helperMessage={helperMessage}
    />
  );
};

export const DatasetSelector: FC<{
  value: string | undefined;
  name: string;
  label: string;
  isReadonly: boolean;
  isDisabled?: boolean;
  helperMessage?: string;
  onChange?: (selected: string) => void;
}> = ({ value, isReadonly, isDisabled = false, onChange, label, name, helperMessage }) => {
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
    <Field name={name} label={label} isDisabled={isReadonly || isDisabled}>
      {({ fieldProps }) => (
        <>
          <Select
            {...fieldProps}
            options={datasetOptions}
            value={selectedOption}
            onChange={(selected) => onChange?.(selected!.value)}
          />
          {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
        </>
      )}
    </Field>
  );
};
