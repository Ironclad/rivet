import { FC, Suspense, useEffect, useMemo, useRef } from 'react';
import {
  AnyDataEditorDefinition,
  ChartNode,
  CodeEditorDefinition,
  DataType,
  DataTypeSelectorEditorDefinition,
  DropdownEditorDefinition,
  EditorDefinition,
  FileBrowserEditorDefinition,
  GraphId,
  GraphSelectorEditorDefinition,
  ImageBrowserEditorDefinition,
  NumberEditorDefinition,
  StringEditorDefinition,
  ToggleEditorDefinition,
  dataTypeDisplayNames,
  getScalarTypeOf,
  globalRivetNodeRegistry,
  isArrayDataType,
  scalarTypes,
  uint8ArrayToBase64,
} from '@ironclad/rivet-core';
import { css } from '@emotion/react';
import { Field, Label } from '@atlaskit/form';
import { match } from 'ts-pattern';
import Toggle from '@atlaskit/toggle';
import TextField from '@atlaskit/textfield';
import Select from '@atlaskit/select';
import Checkbox from '@atlaskit/checkbox';
import { useDebounceFn, useLatest } from 'ahooks';
import type { monaco } from '../utils/monaco.js';
import clsx from 'clsx';
import { projectState } from '../state/savedGraphs.js';
import { useRecoilValue } from 'recoil';
import { orderBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import { LazyCodeEditor, LazyTripleBarColorPicker } from './LazyComponents';
import { ioProvider } from '../utils/globals';
import Button from '@atlaskit/button';
import { values } from '../../../core/src/utils/typeSafety';

export const defaultEditorContainerStyles = css`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  align-content: start;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;

  .row {
    display: grid;
    grid-template-columns: 1fr auto;
    column-gap: 16px;
  }

  .use-input-toggle {
    align-self: center;
    margin-top: 32px;
  }

  .data-type-selector {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 16px;
  }

  .editor-wrapper-wrapper {
    min-height: 300px;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    position: relative;
    /* height: 100%; */
  }

  .editor-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .editor-container {
    height: 100%;
  }

  .row.code {
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
  }

  .row.toggle > div {
    display: flex;
    align-items: center;
    gap: 8px;

    label:first-child {
      min-width: 75px;
    }

    &.use-input-toggle label:first-child {
      min-width: unset;
    }

    div,
    label {
      margin: 0;
    }
  }
`;

export const DefaultNodeEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
}> = ({ node, onChange, isReadonly }) => {
  const editors = useMemo(() => globalRivetNodeRegistry.createDynamicImpl(node).getEditors(), [node]);

  return (
    <div css={defaultEditorContainerStyles}>
      {editors.map((editor, i) => (
        <DefaultNodeEditorField
          key={editor.dataKey}
          node={node}
          onChange={onChange}
          editor={editor}
          isReadonly={isReadonly}
        />
      ))}
    </div>
  );
};

const validSelectableDataTypes = scalarTypes.filter((type) => type !== 'control-flow-excluded');

const DefaultNodeEditorField: FC<{
  node: ChartNode;
  onChange: (changed: ChartNode) => void;
  editor: EditorDefinition<ChartNode>;
  isReadonly: boolean;
}> = ({ node, onChange, editor, isReadonly }) => {
  const data = node.data as Record<string, unknown>;

  const sharedProps = { node, onChange, isReadonly };

  const input = match(editor)
    .with({ type: 'string' }, (editor) => <DefaultStringEditor {...sharedProps} editor={editor} />)
    .with({ type: 'toggle' }, (editor) => <DefaultToggleEditor {...sharedProps} editor={editor} />)
    .with({ type: 'dataTypeSelector' }, (editor) => <DefaultDataTypeSelector {...sharedProps} editor={editor} />)
    .with({ type: 'anyData' }, (editor) => <DefaultAnyDataEditor {...sharedProps} editor={editor} />)
    .with({ type: 'dropdown' }, (editor) => <DefaultDropdownEditor {...sharedProps} editor={editor} />)
    .with({ type: 'number' }, (editor) => <DefaultNumberEditor {...sharedProps} editor={editor} />)
    .with({ type: 'code' }, (editor) => <DefaultCodeEditor {...sharedProps} editor={editor} />)
    .with({ type: 'graphSelector' }, (editor) => <DefaultGraphSelectorEditor {...sharedProps} editor={editor} />)
    .with({ type: 'color' }, (editor) => <DefaultColorEditor {...sharedProps} editor={editor} />)
    .with({ type: 'fileBrowser' }, (editor) => <DefaultFileBrowserEditor {...sharedProps} editor={editor} />)
    .with({ type: 'imageBrowser' }, (editor) => <DefaultImageBrowserEditor {...sharedProps} editor={editor} />)
    .exhaustive();

  const toggle = editor.useInputToggleDataKey ? (
    <div className="use-input-toggle">
      <Toggle
        isChecked={data[editor.useInputToggleDataKey] as boolean | undefined}
        isDisabled={isReadonly}
        onChange={(e) =>
          onChange({
            ...node,
            data: {
              ...data,
              [editor.useInputToggleDataKey!]: e.target.checked,
            },
          })
        }
      />
    </div>
  ) : (
    <div />
  );

  return (
    <div className={clsx('row', editor.type)}>
      {input}
      {toggle}
    </div>
  );
};

export const DefaultStringEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: StringEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
        <TextField
          {...fieldProps}
          value={data[editor.dataKey] as string | undefined}
          isReadOnly={isReadonly}
          onChange={(e) =>
            onChange({
              ...node,
              data: {
                ...data,
                [editor.dataKey]: (e.target as HTMLInputElement).value,
              },
            })
          }
        />
      )}
    </Field>
  );
};

export const DefaultToggleEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;

  onChange: (changed: ChartNode) => void;
  editor: ToggleEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
        <Toggle
          {...fieldProps}
          isChecked={data[editor.dataKey] as boolean | undefined}
          isDisabled={isReadonly}
          onChange={(e) =>
            onChange({
              ...node,
              data: {
                ...data,
                [editor.dataKey]: e.target.checked,
              },
            })
          }
        />
      )}
    </Field>
  );
};

export const DefaultDataTypeSelector: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: DataTypeSelectorEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const dataType = data[editor.dataKey] as DataType | undefined;

  const scalarType = dataType ? getScalarTypeOf(dataType) : undefined;
  const isArray = dataType ? isArrayDataType(dataType) : undefined;

  const dataTypeOptions = validSelectableDataTypes.map((type) => ({
    label: dataTypeDisplayNames[type],
    value: type,
  }));

  const selectedOption = dataTypeOptions.find((option) => option.value === dataType);

  return (
    <div className="data-type-selector">
      <Field name="data-type" label="Data Type" isDisabled={isReadonly}>
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={dataTypeOptions}
            value={selectedOption}
            onChange={(selected) =>
              onChange?.({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: isArray ? (`${selected!.value}[]` as DataType) : selected!.value,
                },
              })
            }
          />
        )}
      </Field>
      <Field label=" " name="is-array" isDisabled={isReadonly}>
        {({ fieldProps }) => (
          <Checkbox
            {...fieldProps}
            label="Array"
            css={css`
              margin-top: 16px;
            `}
            onChange={(e) =>
              onChange?.({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: e.target.checked ? (`${scalarType}[]` as DataType) : scalarType,
                },
              })
            }
          />
        )}
      </Field>
    </div>
  );
};

export const DefaultAnyDataEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: AnyDataEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  // TODO
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
        <TextField
          {...fieldProps}
          value={data[editor.dataKey] as string | undefined}
          isReadOnly={isReadonly}
          onChange={(e) =>
            onChange({
              ...node,
              data: {
                ...data,
                [editor.dataKey]: (e.target as HTMLInputElement).value,
              },
            })
          }
        />
      )}
    </Field>
  );
};

export const DefaultDropdownEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: DropdownEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label} isDisabled={isReadonly}>
      {({ fieldProps }) => (
        <Select
          {...fieldProps}
          options={editor.options}
          value={editor.options.find((option) => option.value === data[editor.dataKey])}
          onChange={(selected) =>
            onChange({
              ...node,
              data: {
                ...data,
                [editor.dataKey]: selected!.value,
              },
            })
          }
        />
      )}
    </Field>
  );
};

export const DefaultGraphSelectorEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: GraphSelectorEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
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

export const DefaultNumberEditor: FC<{
  node: ChartNode;
  isReadonly?: boolean;
  onChange: (changed: ChartNode) => void;
  editor: NumberEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  return (
    <Field name={editor.dataKey} label={editor.label}>
      {({ fieldProps }) => (
        <TextField
          isReadOnly={isReadonly}
          type="number"
          min={editor.min}
          max={editor.max}
          step={editor.step}
          {...fieldProps}
          defaultValue={(data[editor.dataKey] ?? editor.defaultValue) as number | undefined}
          onChange={(e) => {
            if (editor.allowEmpty && (e.target as HTMLInputElement).value === '') {
              onChange({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: undefined,
                },
              });
            } else {
              onChange({
                ...node,
                data: {
                  ...data,
                  [editor.dataKey]: (e.target as HTMLInputElement).valueAsNumber,
                },
              });
            }
          }}
        />
      )}
    </Field>
  );
};

export const DefaultCodeEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: CodeEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor: editorDef }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const nodeLatest = useLatest(node);

  const debouncedOnChange = useDebounceFn<(node: ChartNode) => void>(onChange, { wait: 100 });

  const onEditorChange = (newText: string) => {
    debouncedOnChange.run({
      ...nodeLatest.current,
      data: {
        ...(nodeLatest.current?.data as Record<string, unknown> | undefined),
        [editorDef.dataKey]: newText,
      },
    });
  };

  useEffect(() => {
    if (editorInstance.current) {
      const currentValue = (nodeLatest.current?.data as Record<string, unknown> | undefined)?.[editorDef.dataKey] as
        | string
        | undefined;
      editorInstance.current.setValue(currentValue ?? '');

      editorInstance.current.updateOptions({
        readOnly: isReadonly,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, isReadonly]);

  return (
    <Suspense fallback={<div />}>
      <div className="editor-wrapper-wrapper">
        <Label htmlFor="">{editorDef.label}</Label>
        <div className="editor-wrapper">
          <LazyCodeEditor
            editorRef={editorInstance}
            text={
              ((nodeLatest.current?.data as Record<string, unknown>)[editorDef.dataKey] as string | undefined) ?? ''
            }
            onChange={onEditorChange}
            theme={editorDef.theme}
            language={editorDef.language}
            isReadonly={isReadonly}
          />
        </div>
      </div>
    </Suspense>
  );
};

export const DefaultColorEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: EditorDefinition<ChartNode>;
}> = ({ node, onChange, editor }) => {
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

export const DefaultFileBrowserEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: FileBrowserEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

  const pickFile = async () => {
    await ioProvider.readFileAsBinary(async (data) => {
      onChange({
        ...node,
        data: {
          ...data,
          [editor.dataKey]: await uint8ArrayToBase64(data),
        },
      });
    });
  };

  const b64Data = data[editor.dataKey] as string | undefined;

  const dataUri = b64Data ? `data:base64,${b64Data}` : undefined;
  const dataByteLength = b64Data ? Math.round(b64Data.length * 0.75) : undefined;

  return (
    <Field name={editor.dataKey} label={editor.label}>
      {() => (
        <div>
          <Button onClick={pickFile}>Pick File</Button>
          <div className="current">{dataUri && <span>Data (length {dataByteLength})</span>}</div>
        </div>
      )}
    </Field>
  );
};

export const DefaultImageBrowserEditor: FC<{
  node: ChartNode;
  isReadonly: boolean;
  onChange: (changed: ChartNode) => void;
  editor: ImageBrowserEditorDefinition<ChartNode>;
}> = ({ node, isReadonly, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;

  const pickFile = async () => {
    await ioProvider.readFileAsBinary(async (data) => {
      onChange({
        ...node,
        data: {
          ...data,
          [editor.dataKey]: await uint8ArrayToBase64(data),
        },
      });
    });
  };

  const b64Data = data[editor.dataKey] as string | undefined;
  const mediaType = data[editor.mediaTypeDataKey] as string | undefined;

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
