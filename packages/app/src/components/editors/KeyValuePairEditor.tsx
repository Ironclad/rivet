import { useState, type FC, useEffect } from 'react';
import { type SharedEditorProps } from './SharedEditorProps';
import { type ChartNode, type KeyValuePairEditorDefinition } from '@ironclad/rivet-core';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import { css } from '@emotion/react';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import EyeIcon from 'majesticons/line/eye-line.svg?react';
import EyeOffIcon from 'majesticons/line/eye-off-line.svg?react';
import { getHelperMessage } from './editorUtils';
import { produce } from 'immer';

type KVPair = {
  key: string;
  value: string;
};

const styles = css`
  .key-value-pairs-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .key-value-pairs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .key-value-pair {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .add-pair {
    margin-top: 8px;
  }

  .delete-pair {
    display: flex;
    align-items: center;
    justify-content: center;

    > span {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .buttons {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

type KeyValuePairEditorProps = SharedEditorProps & {
  editor: KeyValuePairEditorDefinition<ChartNode>;
};

export const KeyValuePairEditor: FC<KeyValuePairEditorProps> = ({ node, isReadonly, isDisabled, onChange, editor }) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  const keyValuePairs = data[editor.dataKey] as KVPair[] | undefined;
  const [pairs, setPairs] = useState<KVPair[]>(keyValuePairs || []);

  const handleAddPair = () => {
    setPairs([...pairs, { key: '', value: '' }]);
  };

  const handleDeletePair = (index: number) => {
    setPairs((existingPairs) =>
      produce(existingPairs, (draft) => {
        draft.splice(index, 1);
      }),
    );
  };

  const handlePairChange = (index: number, keyOrValue: 'key' | 'value', value: string) => {
    setPairs((existingPairs) =>
      produce(existingPairs, (draft) => {
        draft[index]![keyOrValue] = value;
      }),
    );
  };

  useEffect(() => {
    onChange({
      ...node,
      data: {
        ...data,
        [editor.dataKey]: pairs,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- would cause cycle
  }, [pairs]);

  return (
    <KeyValuePairs
      label={editor.label}
      name={editor.dataKey}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      keyValuePairs={pairs}
      onAddPair={handleAddPair}
      onDeletePair={handleDeletePair}
      onPairChange={handlePairChange}
      isValuesSecret={editor.valuesSecret ?? false}
      helperMessage={helperMessage}
    />
  );
};

type KeyValuePairsProps = {
  label: string;
  name: string;
  isReadonly?: boolean;
  isDisabled?: boolean;
  keyValuePairs: KVPair[];
  helperMessage?: string;
  isValuesSecret?: boolean;
  onAddPair: () => void;
  onDeletePair: (index: number) => void;
  onPairChange: (index: number, keyOrValue: 'key' | 'value', value: string) => void;
};

export const KeyValuePairs: FC<KeyValuePairsProps> = ({
  label,
  name,
  isReadonly,
  isDisabled,
  isValuesSecret,
  keyValuePairs,
  helperMessage,
  onAddPair,
  onDeletePair,
  onPairChange,
}) => {
  const [showingValues, setShowingValues] = useState(false);

  return (
    <div css={styles}>
      <Field name={name} label={label} isDisabled={isDisabled}>
        {({ fieldProps }) => (
          <div className="key-value-pairs-container">
            {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
            <div className="key-value-pairs">
              {keyValuePairs.map((pair, index) => (
                <div key={index} className="key-value-pair">
                  <TextField
                    {...fieldProps}
                    value={pair.key}
                    onChange={(e) => onPairChange(index, 'key', (e.target as HTMLInputElement).value)}
                    isDisabled={isDisabled}
                    isReadOnly={isReadonly}
                    placeholder="Key"
                    style={{ marginRight: '8px' }}
                  />
                  <TextField
                    {...fieldProps}
                    type={isValuesSecret ? (showingValues ? 'text' : 'password') : 'text'}
                    value={pair.value}
                    onChange={(e) => onPairChange(index, 'value', (e.target as HTMLInputElement).value)}
                    isDisabled={isDisabled}
                    isReadOnly={isReadonly}
                    placeholder="Value"
                    style={{ marginRight: '8px' }}
                  />
                  <Button
                    className="delete-pair"
                    appearance="subtle"
                    onClick={() => onDeletePair(index)}
                    isDisabled={isDisabled || isReadonly}
                    style={{ marginRight: '8px' }}
                  >
                    <CrossIcon />
                  </Button>
                </div>
              ))}
            </div>
            <div className="buttons">
              <Button
                className="add-pair"
                appearance="primary"
                onClick={onAddPair}
                isDisabled={isDisabled || isReadonly}
              >
                Add
              </Button>
              {isValuesSecret && (
                <Button
                  className="show-values"
                  appearance="subtle"
                  onClick={() => setShowingValues(!showingValues)}
                  isDisabled={isDisabled || isReadonly}
                  iconBefore={
                    showingValues ? <EyeIcon width={16} height={16} /> : <EyeOffIcon width={16} height={16} />
                  }
                >
                  {showingValues ? 'Hide Values' : 'Show Values'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Field>
    </div>
  );
};
