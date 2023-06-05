import { ChangeEvent, FC, memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { useLatest } from 'ahooks';
import Toggle from '@atlaskit/toggle';
import { ChartNode, PromptNode, PromptNodeData } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { Field } from '@atlaskit/form';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';

export type PromptNodeEditorProps = {
  node: PromptNode;
  onChange?: (node: PromptNode) => void;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;

  .editor-container {
    flex: 1;
    min-height: 200px;
  }

  .options {
    font-family: 'Roboto', sans-serif;
    color: var(--foreground);
    background-color: var(--grey-darker);

    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 16px;
    column-gap: 32px;
    align-items: center;
    margin-bottom: 16px;

    .row {
      display: contents;
    }

    .label {
      font-weight: 500;
      color: var(--foreground);
    }

    .number-input {
      justify-self: start;
      min-width: 0;
      width: 100px;
    }

    .checkbox-input {
      margin-left: 8px;
      cursor: pointer;

      &:hover {
        opacity: 0.8;
      }
    }
  }
`;

const handleInputChange =
  (key: keyof PromptNodeData, node: PromptNode, onChange?: (node: ChartNode<'prompt', PromptNodeData>) => void) =>
  (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    onChange?.({
      ...node,
      data: {
        ...node.data,
        [key]: value,
      },
    });
  };

export const PromptNodeEditor: FC<PromptNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(node);

  useEffect(() => {
    if (!editorContainer.current) {
      return;
    }

    const editor = monaco.editor.create(editorContainer.current, {
      theme: 'prompt-interpolation',
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 0,
      lineNumbersMinChars: 0,
      language: 'prompt-interpolation',
      minimap: {
        enabled: false,
      },
      value: nodeLatest.current?.data.promptText,
      wordWrap: 'on',
    });
    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.({
        ...nodeLatest.current,
        data: {
          ...nodeLatest.current?.data,
          promptText: editor.getValue(),
        },
      });
    });

    editorInstance.current = editor;

    return () => {
      editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorInstance.current) {
      editorInstance.current.setValue(nodeLatest.current?.data.promptText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  const options = useMemo(
    () =>
      [
        { label: 'User', value: 'user' },
        { label: 'System', value: 'system' },
        { label: 'Assistant', value: 'assistant' },
        { label: 'Tool', value: 'tool' },
      ] as const,
    [],
  );
  const selectedOption = options.find((option) => option.value === node.data.type);

  return (
    <Container>
      <div className="options">
        <Field name="type" label="Type">
          {({ fieldProps }) => (
            <Select
              {...fieldProps}
              id="model"
              value={selectedOption}
              onChange={(selected) => onChange?.({ ...node, data: { ...node.data, type: selected!.value } })}
              options={options}
            />
          )}
        </Field>

        <Toggle
          id="useModelInput"
          isChecked={node.data.useTypeInput}
          onChange={handleInputChange('useTypeInput', node, onChange)}
        />
        <Field name="name" label="Name">
          {({ fieldProps }) => (
            <TextField
              {...fieldProps}
              value={node.data.name ?? ''}
              onChange={(e) => ({
                ...node,
                data: {
                  ...node.data,
                  name: (e.target as HTMLInputElement).value,
                },
              })}
            />
          )}
        </Field>
        <Toggle
          id="useNameInput"
          isChecked={node.data.useNameInput}
          onChange={handleInputChange('useNameInput', node, onChange)}
        />
      </div>

      <div ref={editorContainer} className="editor-container" />
    </Container>
  );
};

export type PromptNodeBodyProps = {
  node: PromptNode;
};

const Body = styled.div`
  font-size: 12px;

  pre {
    white-space: pre-wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const PromptNodeBody: FC<PromptNodeBodyProps> = memo(({ node }) => {
  const bodyRef = useRef<HTMLPreElement>(null);

  const truncated = useMemo(
    () => node.data.promptText.split('\n').slice(0, 15).join('\n').trim(),
    [node.data.promptText],
  );

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'prompt-interpolation',
    });
  }, [truncated]);

  return (
    <Body>
      <div>
        <em>{typeDisplay[node.data.type]}:</em>
      </div>
      <pre ref={bodyRef} className="pre-wrap" data-lang="prompt-interpolation">
        {truncated}
      </pre>
    </Body>
  );
});

const typeDisplay: Record<PromptNodeData['type'], string> = {
  assistant: 'Assistant',
  system: 'System',
  user: 'User',
  tool: 'Tool',
};

export const promptNodeDescriptor: NodeComponentDescriptor<'prompt'> = {
  Body: PromptNodeBody,
  OutputSimple: undefined,
  Editor: PromptNodeEditor,
};
