import { useState, type FC, useEffect, useMemo } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { type ChartNode, type StringListEditorDefinition } from '@ironclad/rivet-core';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import { css } from '@emotion/react';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import { getHelperMessage } from './editorUtils';

const styles = css`
  .string-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .string-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-item {
    margin-top: 8px;
  }

  .delete-item {
    display: flex;
    align-items: center;
    justify-content: center;

    > span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .helperMessage {
    margin-top: 8px;
    margin-bottom: 8px;
  }
`;

type StringListEditorProps = SharedEditorProps & {
  editor: StringListEditorDefinition<ChartNode>;
};

export const StringListEditor: FC<StringListEditorProps> = ({
  node,
  isReadonly,
  isDisabled,
  onChange,
  editor,
  onClose,
}) => {
  const data = node.data as Record<string, unknown>;
  const stringListValue = data[editor.dataKey] as string[] | string | undefined;

  const stringList = useMemo(
    () => (!stringListValue ? [] : Array.isArray(stringListValue) ? stringListValue : [stringListValue]),
    [stringListValue],
  );

  const helperMessage = getHelperMessage(editor, node.data);

  const [items, setItems] = useState<string[]>(stringList || []);

  const handleAddItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);

    onChange({
      ...node,
      data: {
        ...data,
        [editor.dataKey]: newItems,
      },
    });
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);

    onChange({
      ...node,
      data: {
        ...data,
        [editor.dataKey]: newItems,
      },
    });
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);

    onChange({
      ...node,
      data: {
        ...data,
        [editor.dataKey]: newItems,
      },
    });
  };

  useEffect(() => {
    setItems(stringList);
  }, [stringList]);

  return (
    <StringList
      label={editor.label}
      dataKey={editor.dataKey}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      helperMessage={helperMessage}
      stringList={items}
      onAddItem={handleAddItem}
      onDeleteItem={handleDeleteItem}
      onItemChange={handleItemChange}
      onClose={onClose}
    />
  );
};

type StringListProps = {
  label: string;
  dataKey: string;
  isReadonly?: boolean;
  isDisabled?: boolean;
  stringList: string[];
  helperMessage?: string;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
  onItemChange: (index: number, value: string) => void;
  onClose?: () => void;
};

export const StringList: FC<StringListProps> = ({
  label,
  dataKey,
  isReadonly,
  isDisabled,
  stringList,
  helperMessage,
  onAddItem,
  onDeleteItem,
  onItemChange,
  onClose,
}) => {
  return (
    <div css={styles}>
      <Field name={dataKey} label={label} isDisabled={isDisabled}>
        {({ fieldProps }) => (
          <>
            {helperMessage && (
              <div className="helperMessage">
                <HelperMessage>{helperMessage}</HelperMessage>
              </div>
            )}
            <div className="string-list">
              {stringList.map((item, index) => (
                <div key={index} className="string-item">
                  <TextField
                    {...fieldProps}
                    value={item}
                    onChange={(e) => onItemChange(index, (e.target as HTMLInputElement).value)}
                    isDisabled={isDisabled}
                    isReadOnly={isReadonly}
                    placeholder="Item"
                    style={{ marginRight: '8px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        onClose?.();
                      }
                    }}
                  />
                  <Button
                    className="delete-item"
                    appearance="subtle"
                    onClick={() => onDeleteItem(index)}
                    isDisabled={isDisabled || isReadonly}
                    style={{ marginRight: '8px' }}
                  >
                    <CrossIcon />
                  </Button>
                </div>
              ))}
            </div>
            <Button className="add-item" appearance="primary" onClick={onAddItem} isDisabled={isDisabled || isReadonly}>
              Add
            </Button>
          </>
        )}
      </Field>
    </div>
  );
};
