import { ChartNode, DataType } from '../index.js';

type ExcludeNeverValues<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends never ? never : K;
  }[keyof T]
>;

type DataOfType<T extends ChartNode, Type> = keyof ExcludeNeverValues<{
  [P in keyof T['data']]-?: NonNullable<T['data'][P]> extends Type ? T['data'][P] : never;
}>;

export type StringEditorDefinition<T extends ChartNode> = {
  type: 'string';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type ToggleEditorDefinition<T extends ChartNode> = {
  type: 'toggle';
  label: string;

  dataKey: DataOfType<T, boolean>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DataTypeSelectorEditorDefinition<T extends ChartNode> = {
  type: 'dataTypeSelector';
  label: string;

  dataKey: DataOfType<T, DataType>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type AnyDataEditorDefinition<T extends ChartNode> = {
  type: 'anyData';
  label: string;

  dataKey: DataOfType<T, any>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DropdownEditorDefinition<T extends ChartNode> = {
  type: 'dropdown';
  label: string;

  dataKey: DataOfType<T, string>;
  options: {
    value: string;
    label: string;
  }[];

  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type GraphSelectorEditorDefinition<T extends ChartNode> = {
  type: 'graphSelector';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type NumberEditorDefinition<T extends ChartNode> = {
  type: 'number';
  label: string;

  defaultValue?: number;

  useInputToggleDataKey?: DataOfType<T, boolean>;

  min?: number;
  max?: number;
  step?: number;
} & (
  | {
      dataKey: DataOfType<T, number>;
      allowEmpty?: false;
    }
  | {
      dataKey: DataOfType<T, number | undefined>;
      allowEmpty: true;
    }
);

export type CodeEditorDefinition<T extends ChartNode> = {
  type: 'code';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  language: string;
  theme?: string;
};

export type ColorEditorDefinition<T extends ChartNode> = {
  type: 'color';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type FileBrowserEditorDefinition<T extends ChartNode> = {
  type: 'fileBrowser';
  label: string;

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  accept?: string;
};

export type ImageBrowserEditorDefinition<T extends ChartNode> = {
  type: 'imageBrowser';
  label: string;

  dataKey: DataOfType<T, string>;
  mediaTypeDataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type EditorDefinition<T extends ChartNode> =
  | StringEditorDefinition<T>
  | ToggleEditorDefinition<T>
  | DataTypeSelectorEditorDefinition<T>
  | AnyDataEditorDefinition<T>
  | DropdownEditorDefinition<T>
  | NumberEditorDefinition<T>
  | CodeEditorDefinition<T>
  | GraphSelectorEditorDefinition<T>
  | ColorEditorDefinition<T>
  | GraphSelectorEditorDefinition<T>
  | FileBrowserEditorDefinition<T>
  | ImageBrowserEditorDefinition<T>;
