import { type ChartNode, type DataRef, type DataType, type DataValue, type DatasetId } from '../index.js';

type ExcludeNeverValues<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends never ? never : K;
  }[keyof T]
>;

type DataOfType<T extends ChartNode, Type> = keyof ExcludeNeverValues<{
  [P in keyof T['data']]-?: NonNullable<T['data'][P]> extends Type ? T['data'][P] : never;
}>;

export type SharedEditorDefinitionProps<T extends ChartNode> = {
  label: string;

  helperMessage?: string | ((data: T['data']) => string | undefined);

  autoFocus?: boolean;

  hideIf?: (data: T['data']) => boolean;

  disableIf?: (data: T['data']) => boolean;
};

export type StringEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'string';

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
  placeholder?: string;
  maxLength?: number;
};

export type ToggleEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'toggle';

  dataKey: DataOfType<T, boolean>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DataTypeSelectorEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'dataTypeSelector';

  dataKey: DataOfType<T, DataType>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DatasetSelectorEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'datasetSelector';

  dataKey: DataOfType<T, DatasetId>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type AnyDataEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'anyData';

  dataKey: DataOfType<T, any>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type DropdownEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'dropdown';

  dataKey: DataOfType<T, string>;
  options: {
    value: string;
    label: string;
  }[];
  defaultValue?: string;

  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type GraphSelectorEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'graphSelector';

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type NumberEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'number';

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

export type CodeEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'code';

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  language: string;
  theme?: string;
};

export type ColorEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'color';

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type FilePathBrowserEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'filePathBrowser';

  dataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  accept?: string;
};

export type FileBrowserEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'fileBrowser';

  dataKey: DataOfType<T, DataRef>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  accept?: string;
};

export type ImageBrowserEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'imageBrowser';

  dataKey: DataOfType<T, DataRef>;
  mediaTypeDataKey: DataOfType<T, string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
};

export type KeyValuePairEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'keyValuePair';

  dataKey: DataOfType<T, { key: string; value: string }[]>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  keyPlaceholder?: string;
  valuePlaceholder?: string;

  valuesSecret?: boolean;
};

export type StringListEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'stringList';

  dataKey: DataOfType<T, string[] | string>;
  useInputToggleDataKey?: DataOfType<T, boolean>;

  placeholder?: string;
};

export type EditorDefinitionGroup<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'group';
  defaultOpen?: boolean;
  editors: EditorDefinition<T>[];
};

export type CustomEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'custom';
  customEditorId: string;
  dataKey?: DataOfType<T, any>;
  useInputToggleDataKey?: DataOfType<T, boolean>;
  data?: any;
};

export type DynamicEditorEditor = EditorDefinition<any>['type'] | 'none' | 'auto';

export type DynamicEditorDefinition<T extends ChartNode> = SharedEditorDefinitionProps<T> & {
  type: 'dynamic';

  dataKey: DataOfType<T, Record<string, DataValue>>;
  dynamicDataKey: string;
  useInputToggleDataKey?: DataOfType<T, boolean>;
  dataType: DataType;
  editor: DynamicEditorEditor;
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
  | ImageBrowserEditorDefinition<T>
  | DatasetSelectorEditorDefinition<T>
  | KeyValuePairEditorDefinition<T>
  | EditorDefinitionGroup<T>
  | StringListEditorDefinition<T>
  | CustomEditorDefinition<T>
  | DynamicEditorDefinition<T>
  | FilePathBrowserEditorDefinition<T>;
