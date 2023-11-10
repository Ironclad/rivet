import { useState, type FC, useEffect } from 'react';
import { type SharedEditorProps } from '../SharedEditorProps';
import { type CustomEditorDefinition, type ChartNode, type GraphId } from '@ironclad/rivet-core';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { Field, HelperMessage } from '@atlaskit/form';
import { css } from '@emotion/react';
import CrossIcon from 'majesticons/line/multiply-line.svg?react';
import EyeIcon from 'majesticons/line/eye-line.svg?react';
import EyeOffIcon from 'majesticons/line/eye-off-line.svg?react';
import { getHelperMessage } from '../editorUtils';
import { GraphSelectorSelect } from '../GraphSelectorEditor';
import { produce } from 'immer';

type ToolCallHandlerPair = {
  key: string;
  value: GraphId;
};

const styles = css`
  .tool-call-handlers-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tool-call-handlers-pairs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tool-call-handlers-pair {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
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

type ToolCallHandlersEditorProps = SharedEditorProps & {
  editor: CustomEditorDefinition<ChartNode>;
};

export const ToolCallHandlersEditor: FC<ToolCallHandlersEditorProps> = ({
  node,
  isReadonly,
  isDisabled,
  onChange,
  editor,
}) => {
  const data = node.data as Record<string, unknown>;
  const helperMessage = getHelperMessage(editor, node.data);
  const keyValuePairs = data[editor.dataKey!] as ToolCallHandlerPair[] | undefined;
  const [pairs, setPairs] = useState<ToolCallHandlerPair[]>(keyValuePairs || []);

  const handleAddPair = () => {
    setPairs([...pairs, { key: '', value: '' as GraphId }]);
  };

  const handleDeletePair = (index: number) => {
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };

  const handlePairChange = (
    value: { index: number; keyOrValue: 'key'; value: string } | { index: number; keyOrValue: 'value'; value: GraphId },
  ) => {
    const newPairs = produce(pairs, (draft) => {
      if (value.keyOrValue === 'key') {
        draft[value.index]!.key = value.value;
      } else {
        draft[value.index]!.value = value.value;
      }
    });

    setPairs(newPairs);
  };

  useEffect(() => {
    onChange({
      ...node,
      data: {
        ...data,
        [editor.dataKey!]: pairs,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- would cause cycle
  }, [pairs]);

  return (
    <ToolCallHandlers
      label={editor.label}
      name={editor.dataKey!}
      isReadonly={isReadonly}
      isDisabled={isDisabled}
      keyValuePairs={pairs}
      onAddPair={handleAddPair}
      onDeletePair={handleDeletePair}
      onPairChange={handlePairChange}
      helperMessage={helperMessage}
    />
  );
};

type ToolCallHandlersProps = {
  label: string;
  name: string;
  isReadonly?: boolean;
  isDisabled?: boolean;
  keyValuePairs: ToolCallHandlerPair[];
  helperMessage?: string;
  isValuesSecret?: boolean;
  onAddPair: () => void;
  onDeletePair: (index: number) => void;
  onPairChange: (
    value: { index: number; keyOrValue: 'key'; value: string } | { index: number; keyOrValue: 'value'; value: GraphId },
  ) => void;
};

export const ToolCallHandlers: FC<ToolCallHandlersProps> = ({
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
          <div className="tool-call-handlers-container">
            {helperMessage && <HelperMessage>{helperMessage}</HelperMessage>}
            <div className="tool-call-handlers-pairs">
              {keyValuePairs.map((pair, index) => (
                <div key={index} className="tool-call-handlers-pair">
                  <TextField
                    {...fieldProps}
                    value={pair.key}
                    onChange={(e) =>
                      onPairChange({ index, keyOrValue: 'key', value: (e.target as HTMLInputElement).value })
                    }
                    isDisabled={isDisabled}
                    isReadOnly={isReadonly}
                    placeholder="Tool ID"
                    style={{ marginRight: '8px' }}
                  />
                  <GraphSelectorSelect
                    value={pair.value}
                    isReadonly={isReadonly}
                    onChange={(v) => onPairChange({ index, keyOrValue: 'value', value: v })}
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
                Add Handler
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
