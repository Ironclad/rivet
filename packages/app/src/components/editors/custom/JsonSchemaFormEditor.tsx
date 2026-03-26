import { Field, HelperMessage } from '@atlaskit/form';
import Button from '@atlaskit/button';
import Portal from '@atlaskit/portal';
import Select from '@atlaskit/select';
import TextArea from '@atlaskit/textarea';
import TextField from '@atlaskit/textfield';
import Toggle from '@atlaskit/toggle';
import { css } from '@emotion/react';
import Form from '@rjsf/core';
import {
  ADDITIONAL_PROPERTY_FLAG,
  type ArrayFieldItemTemplateProps,
  type ArrayFieldTemplateProps,
  buttonId,
  canExpand,
  errorId,
  type ErrorListProps,
  type FieldErrorProps,
  type FieldHelpProps,
  type FieldTemplateProps,
  getTemplate,
  getUiOptions,
  type IconButtonProps,
  type ObjectFieldTemplateProps,
  type RJSFSchema,
  type UiSchema,
  type WidgetProps,
  type WrapIfAdditionalTemplateProps,
  TranslatableString,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import {
  type ChartNode,
  type JsonSchemaFormCustomEditorDefinition,
  type JsonSchemaFormEditorData,
} from '@ironclad/rivet-core';
import { type FC, type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { getHelperMessage } from '../editorUtils';
import { type SharedEditorProps } from '../SharedEditorProps';

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 8px;

  .json-schema-form-surface {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    border: 1px solid var(--grey-darkish);
    border-radius: 8px;
    background: var(--grey-subtle-accent);
  }

  .json-schema-form-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .json-schema-form-field,
  .json-schema-form-field > div,
  .json-schema-form-object,
  .json-schema-form-array {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .json-schema-form-object,
  .json-schema-form-array {
    border: 1px solid var(--grey-darkish);
    border-radius: 8px;
    padding: 12px;
    background: var(--grey-dark-seethrougher);
  }

  .json-schema-form-title {
    margin: 0;
    color: var(--label-color);
    font-family: var(--label-font-family);
    font-weight: var(--label-font-weight);
    font-size: 0.95rem;
  }

  .json-schema-form-description {
    color: var(--foreground-muted);
    font-size: 0.9rem;
  }

  .json-schema-form-array-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .json-schema-form-array-item {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .json-schema-form-array-item-body {
    flex: 1 1 auto;
    min-width: 0;
  }

  .json-schema-form-array-item-toolbar,
  .json-schema-form-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .json-schema-form-error-list,
  .json-schema-form-config-error {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--error-dark);
    border-radius: 8px;
    background: rgba(231, 76, 60, 0.12);
    color: var(--foreground);
  }

  .json-schema-form-error-list-title,
  .json-schema-form-config-error-title {
    margin: 0;
    color: var(--error-light);
    font-family: var(--label-font-family);
    font-weight: var(--label-font-weight);
  }

  .json-schema-form-errors {
    margin: 0;
    padding-left: 20px;
    color: var(--error-light);
  }

  .json-schema-form-help {
    color: var(--foreground-muted);
  }

  .json-schema-form-hidden {
    display: none;
  }

  .json-schema-form-additional-prop {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .json-schema-form-additional-prop-key {
    flex: 0 0 40%;
    min-width: 0;
  }

  .json-schema-form-additional-prop-value {
    flex: 1 1 auto;
    min-width: 0;
  }

  .json-schema-form-additional-prop-value .json-schema-form-field {
    gap: 0;
  }

  .json-schema-form-additional-prop-value .json-schema-form-field label {
    display: none;
  }

  .json-schema-form-additional-prop-value .json-schema-form-field > div {
    margin-top: 0;
  }
`;

type JsonSchemaFormEditorProps = SharedEditorProps & {
  editor: JsonSchemaFormCustomEditorDefinition<ChartNode>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value != null && !Array.isArray(value);

const isJsonSchemaFormEditorData = (value: unknown): value is JsonSchemaFormEditorData =>
  isRecord(value) && isRecord(value.schema);

const getFormData = (value: unknown) => (isRecord(value) ? value : {});

const RjsfTextWidget = ({ id, value, disabled, readonly, autofocus, placeholder, onChange, options }: WidgetProps) => (
  <TextField
    id={id}
    value={value == null ? '' : String(value)}
    isDisabled={disabled}
    isReadOnly={readonly}
    autoFocus={autofocus}
    autoComplete="off"
    spellCheck={false}
    placeholder={placeholder}
    type={typeof options.inputType === 'string' ? options.inputType : 'text'}
    onChange={(event) => onChange((event.target as HTMLInputElement).value)}
  />
);

const RjsfTextareaWidget = ({
  id,
  value,
  disabled,
  readonly,
  autofocus,
  placeholder,
  onChange,
}: WidgetProps) => (
  <TextArea
    id={id}
    value={value == null ? '' : String(value)}
    isDisabled={disabled}
    isReadOnly={readonly}
    isCompact={false}
    minimumRows={4}
    autoFocus={autofocus}
    placeholder={placeholder}
    onChange={(event) => onChange((event.target as HTMLTextAreaElement).value)}
  />
);

const RjsfCheckboxWidget = ({ id, value, disabled, readonly, onChange }: WidgetProps) => (
  <Toggle id={id} isChecked={Boolean(value)} isDisabled={disabled || readonly} onChange={(event) => onChange(event.target.checked)} />
);

const RjsfNumberWidget = ({ id, value, disabled, readonly, autofocus, placeholder, onChange, options }: WidgetProps) => (
  <TextField
    id={id}
    type="number"
    value={value == null ? '' : String(value)}
    isDisabled={disabled}
    isReadOnly={readonly}
    autoFocus={autofocus}
    placeholder={placeholder}
    min={typeof options.min === 'number' ? options.min : undefined}
    max={typeof options.max === 'number' ? options.max : undefined}
    step={typeof options.step === 'number' ? options.step : undefined}
    onChange={(event) => {
      const nextValue = (event.target as HTMLInputElement).value;
      if (nextValue === '') {
        onChange(options.emptyValue ?? undefined);
        return;
      }

      const parsedValue = Number(nextValue);
      onChange(Number.isNaN(parsedValue) ? options.emptyValue ?? undefined : parsedValue);
    }}
  />
);

const RjsfSelectWidget = ({ id, value, disabled, readonly, placeholder, options, onChange, multiple }: WidgetProps) => {
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLDivElement | null>(null);
  const enumOptions = options.enumOptions ?? [];

  const selectedValue = multiple
    ? enumOptions.filter((option) => Array.isArray(value) && value.includes(option.value))
    : enumOptions.find((option) => option.value === value) ?? null;

  return (
    <>
      <Select
        inputId={id}
        options={enumOptions}
        value={selectedValue}
        isMulti={multiple}
        isDisabled={disabled || readonly}
        placeholder={placeholder}
        menuPortalTarget={menuPortalTarget}
        onChange={(selected) => {
          if (multiple) {
            onChange(Array.isArray(selected) ? selected.map((option) => option.value) : []);
          } else {
            onChange((selected as { value?: unknown } | null)?.value);
          }
        }}
      />
      <Portal>
        <div ref={setMenuPortalTarget} />
      </Portal>
    </>
  );
};

const RjsfFieldHelpTemplate = ({ help }: FieldHelpProps) => {
  if (!help) {
    return null;
  }

  return <div className="json-schema-form-help"><HelperMessage>{help}</HelperMessage></div>;
};

const RjsfFieldErrorTemplate = ({ errors = [], fieldPathId }: FieldErrorProps) => {
  const visibleErrors = errors.filter(Boolean);

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <ul id={errorId(fieldPathId)} className="json-schema-form-errors">
      {visibleErrors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
  );
};

const RjsfFieldTemplate = (props: FieldTemplateProps) => {
  const {
    id,
    classNames,
    style,
    label,
    description,
    children,
    errors,
    help,
    hidden,
    required,
    displayLabel,
    uiSchema,
    disabled,
    registry,
  } = props;

  if (hidden) {
    return <div className="json-schema-form-hidden">{children}</div>;
  }

  const uiOptions = getUiOptions(uiSchema);
  const WrapIfAdditional = getTemplate<'WrapIfAdditionalTemplate'>(
    'WrapIfAdditionalTemplate',
    registry,
    uiOptions,
  );

  if (!displayLabel) {
    return (
      <WrapIfAdditional {...props}>
        <div className={classNames} style={style}>
          {description}
          {children}
          {help}
          {errors}
        </div>
      </WrapIfAdditional>
    );
  }

  return (
    <WrapIfAdditional {...props}>
      <div className={`json-schema-form-field ${classNames ?? ''}`} style={style}>
        <Field
          name={id}
          label={required ? `${label} *` : label}
          isDisabled={Boolean(disabled)}
        >
          {() => (
            <>
              {uiOptions.description ? <div className="json-schema-form-description">{description}</div> : description}
              {children}
              {help}
              {errors}
            </>
          )}
        </Field>
      </div>
    </WrapIfAdditional>
  );
};

const RjsfObjectFieldTemplate = ({
  title,
  description,
  properties,
  disabled,
  readonly,
  schema,
  uiSchema,
  formData,
  onAddProperty,
  fieldPathId,
  required,
}: ObjectFieldTemplateProps) => (
  <div className="json-schema-form-object">
    {title ? <h4 className="json-schema-form-title">{required ? `${title} *` : title}</h4> : null}
    {description ? <div className="json-schema-form-description">{description}</div> : null}
    {properties.filter((property) => !property.hidden).map((property) => (
      <div key={property.name}>{property.content}</div>
    ))}
    {canExpand(schema, uiSchema, formData) ? (
      <div className="json-schema-form-actions">
        <RjsfAddButton
          id={buttonId(fieldPathId, 'add')}
          onClick={onAddProperty}
          disabled={disabled || readonly}
          registry={undefined as never}
        />
      </div>
    ) : null}
  </div>
);

const RjsfArrayFieldItemTemplate = ({ children, buttonsProps, hasToolbar, itemKey }: ArrayFieldItemTemplateProps) => {
  const {
    fieldPathId,
    disabled,
    readonly,
    hasCopy,
    hasMoveDown,
    hasMoveUp,
    hasRemove,
    onCopyItem,
    onMoveDownItem,
    onMoveUpItem,
    onRemoveItem,
  } = buttonsProps;

  return (
    <div className="json-schema-form-array-item" key={itemKey}>
      <div className="json-schema-form-array-item-body">{children}</div>
      {hasToolbar ? (
        <div className="json-schema-form-array-item-toolbar">
          {(hasMoveUp || hasMoveDown) && (
            <RjsfMoveUpButton
              id={buttonId(fieldPathId, 'moveUp')}
              disabled={disabled || readonly || !hasMoveUp}
              onClick={onMoveUpItem}
              registry={undefined as never}
            />
          )}
          {(hasMoveUp || hasMoveDown) && (
            <RjsfMoveDownButton
              id={buttonId(fieldPathId, 'moveDown')}
              disabled={disabled || readonly || !hasMoveDown}
              onClick={onMoveDownItem}
              registry={undefined as never}
            />
          )}
          {hasCopy ? (
            <RjsfCopyButton
              id={buttonId(fieldPathId, 'copy')}
              disabled={disabled || readonly}
              onClick={onCopyItem}
              registry={undefined as never}
            />
          ) : null}
          {hasRemove ? (
            <RjsfRemoveButton
              id={buttonId(fieldPathId, 'remove')}
              disabled={disabled || readonly}
              onClick={onRemoveItem}
              registry={undefined as never}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const RjsfArrayFieldTemplate = ({ canAdd, items, onAddClick, disabled, readonly, title, required, schema }: ArrayFieldTemplateProps) => (
  <div className="json-schema-form-array">
    {title ? <h4 className="json-schema-form-title">{required ? `${title} *` : title}</h4> : null}
    {typeof schema.description === 'string' ? (
      <div className="json-schema-form-description">{schema.description}</div>
    ) : null}
    <div className="json-schema-form-array-items">{items}</div>
    {canAdd ? (
      <div className="json-schema-form-actions">
        <RjsfAddButton
          onClick={onAddClick}
          disabled={disabled || readonly}
          registry={undefined as never}
        />
      </div>
    ) : null}
  </div>
);

const RjsfErrorListTemplate = ({ errors, registry }: ErrorListProps) => (
  <div className="json-schema-form-error-list">
    <h4 className="json-schema-form-error-list-title">{registry.translateString(TranslatableString.ErrorsLabel)}</h4>
    <ul className="json-schema-form-errors">
      {errors.map((error, index) => (
        <li key={index}>{error.stack}</li>
      ))}
    </ul>
  </div>
);

const RjsfButton = ({
  id,
  disabled,
  onClick,
  appearance,
  children,
}: {
  id?: string;
  disabled?: boolean;
  onClick?: (event?: any) => void;
  appearance: 'primary' | 'subtle';
  children: ReactNode;
}) => (
  <Button
    id={id}
    appearance={appearance}
    isDisabled={disabled}
    onClick={onClick}
    type="button"
  >
    {children}
  </Button>
);

const RjsfAddButton = ({ id, disabled, onClick }: IconButtonProps) => (
  <RjsfButton id={id} appearance="primary" disabled={disabled} onClick={onClick}>
    Add
  </RjsfButton>
);

const RjsfCopyButton = ({ id, disabled, onClick }: IconButtonProps) => (
  <RjsfButton id={id} appearance="subtle" disabled={disabled} onClick={onClick}>
    Copy
  </RjsfButton>
);

const RjsfMoveUpButton = ({ id, disabled, onClick }: IconButtonProps) => (
  <RjsfButton id={id} appearance="subtle" disabled={disabled} onClick={onClick}>
    Up
  </RjsfButton>
);

const RjsfMoveDownButton = ({ id, disabled, onClick }: IconButtonProps) => (
  <RjsfButton id={id} appearance="subtle" disabled={disabled} onClick={onClick}>
    Down
  </RjsfButton>
);

const RjsfRemoveButton = ({ id, disabled, onClick }: IconButtonProps) => (
  <RjsfButton id={id} appearance="subtle" disabled={disabled} onClick={onClick}>
    Remove
  </RjsfButton>
);

const RjsfWrapIfAdditionalTemplate = ({
  id,
  disabled,
  label,
  onKeyRenameBlur,
  onRemoveProperty,
  readonly,
  schema,
  children,
}: WrapIfAdditionalTemplateProps) => {
  const isAdditional = ADDITIONAL_PROPERTY_FLAG in schema;

  if (!isAdditional) {
    return <>{children}</>;
  }

  return (
    <div className="json-schema-form-additional-prop">
      <div className="json-schema-form-additional-prop-key">
        <TextField
          id={`${id}-key`}
          defaultValue={label}
          onBlur={(event) => onKeyRenameBlur(event.nativeEvent as any)}
          isDisabled={disabled}
          isReadOnly={readonly}
          placeholder="key"
          autoComplete="off"
        />
      </div>
      <div className="json-schema-form-additional-prop-value">
        {children}
      </div>
      <RjsfRemoveButton
        id={buttonId(id, 'remove')}
        disabled={disabled || readonly}
        onClick={onRemoveProperty}
        registry={undefined as never}
      />
    </div>
  );
};

const templates = {
  ArrayFieldTemplate: RjsfArrayFieldTemplate,
  ArrayFieldItemTemplate: RjsfArrayFieldItemTemplate,
  ErrorListTemplate: RjsfErrorListTemplate,
  FieldErrorTemplate: RjsfFieldErrorTemplate,
  FieldHelpTemplate: RjsfFieldHelpTemplate,
  FieldTemplate: RjsfFieldTemplate,
  ObjectFieldTemplate: RjsfObjectFieldTemplate,
  WrapIfAdditionalTemplate: RjsfWrapIfAdditionalTemplate,
  ButtonTemplates: {
    AddButton: RjsfAddButton,
    CopyButton: RjsfCopyButton,
    MoveDownButton: RjsfMoveDownButton,
    MoveUpButton: RjsfMoveUpButton,
    RemoveButton: RjsfRemoveButton,
    SubmitButton: () => null,
    ClearButton: () => null,
  },
};

const widgets = {
  CheckboxWidget: RjsfCheckboxWidget,
  EmailWidget: RjsfTextWidget,
  PasswordWidget: RjsfTextWidget,
  SelectWidget: RjsfSelectWidget,
  TextareaWidget: RjsfTextareaWidget,
  TextWidget: RjsfTextWidget,
  URLWidget: RjsfTextWidget,
  UpDownWidget: RjsfNumberWidget,
};

function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  if (!deepEqual(ref.current, value)) {
    ref.current = value;
  }
  return ref.current;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const keysA = Object.keys(aObj);
  const keysB = Object.keys(bObj);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((k) => deepEqual(aObj[k], bObj[k]));
}

export const JsonSchemaFormEditor: FC<JsonSchemaFormEditorProps> = ({
  node,
  isReadonly,
  isDisabled,
  onChange,
  editor,
}) => {
  const helperMessage = getHelperMessage(editor, node.data);
  const data = node.data as Record<string, unknown>;
  const dataKey = editor.dataKey as string | undefined;

  const editorData = isJsonSchemaFormEditorData(editor.data) ? editor.data : null;
  const hasDataKey = Boolean(dataKey);
  const currentValue = dataKey ? data[dataKey] : undefined;
  const hasCompatibleValue = currentValue == null || isRecord(currentValue);

  const stableEditorSchema = useDeepMemo(editorData?.schema);
  const stableEditorUiSchema = useDeepMemo(editorData?.uiSchema);

  const schema = useMemo(() => {
    if (!stableEditorSchema) {
      return undefined;
    }

    const nextSchema = { ...(stableEditorSchema as RJSFSchema) };

    if (nextSchema.title === editor.label) {
      delete nextSchema.title;
    }

    return nextSchema;
  }, [stableEditorSchema, editor.label]);

  const uiSchema = useMemo(
    () => (stableEditorUiSchema ?? {}) as UiSchema,
    [stableEditorUiSchema],
  );

  const formData = useDeepMemo(getFormData(currentValue));

  const nodeRef = useRef(node);
  nodeRef.current = node;
  const dataRef = useRef(data);
  dataRef.current = data;

  const handleChange = useCallback(
    (event: { formData?: unknown }) => {
      onChange({
        ...nodeRef.current,
        data: {
          ...dataRef.current,
          [dataKey!]: getFormData(event.formData),
        },
      });
    },
    [onChange, dataKey],
  );

  if (!editorData || !schema || !hasDataKey || !hasCompatibleValue) {
    const errorMessage = !editorData
      ? `\`'JsonSchemaForm'\` requires \`editor.data.schema\`.`
      : !hasDataKey
          ? `\`'JsonSchemaForm'\` requires \`editor.dataKey\` to point at an object-valued node field.`
          : `\`'JsonSchemaForm'\` can only bind to object values; received a non-object at \`${dataKey}\`.`;

    return (
      <div css={styles}>
        <Field name={dataKey ?? editor.label} label={editor.label} isDisabled={isDisabled}>
          {() => (
            <div className="json-schema-form-surface">
              {helperMessage ? <HelperMessage>{helperMessage}</HelperMessage> : null}
              <div className="json-schema-form-config-error">
                <h4 className="json-schema-form-config-error-title">Invalid JSON schema form editor configuration</h4>
                <div>{errorMessage}</div>
              </div>
            </div>
          )}
        </Field>
      </div>
    );
  }

  return (
    <div css={styles}>
      <Field name={dataKey ?? editor.label} label={editor.label} isDisabled={isDisabled}>
        {() => (
          <div className="json-schema-form-surface">
            {helperMessage ? <HelperMessage>{helperMessage}</HelperMessage> : null}
            <Form
              className="json-schema-form-root"
              tagName="div"
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              validator={validator}
              widgets={widgets}
              templates={templates}
              disabled={isDisabled}
              readonly={isReadonly}
              liveValidate={editorData.liveValidate ?? true}
              noHtml5Validate={editorData.noHtml5Validate ?? true}
              showErrorList={editorData.showErrorList ?? false}
              onChange={handleChange}
            >
              <></>
            </Form>
          </div>
        )}
      </Field>
    </div>
  );
};
