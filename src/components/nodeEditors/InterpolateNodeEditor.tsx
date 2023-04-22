import { FC, useEffect, useRef } from 'react';
import { ChartNode } from '../../model/NodeBase';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { InterpolateNode } from '../../model/nodes/InterpolateNode';
import { useLatest } from 'ahooks';

export type InterpolateNodeEditorProps = {
  node: ChartNode;
  onChange?: (node: ChartNode) => void;
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
    grid-template-columns: auto 1fr auto;
    row-gap: 16px;
    column-gap: 32px;
    align-items: center;
    grid-auto-rows: 40px;

    .row {
      display: contents;
    }

    .label {
      font-weight: 500;
      color: var(--foreground);
    }

    .select,
    .number-input {
      padding: 6px 12px;
      background-color: var(--grey-darkish);
      border: 1px solid var(--grey);
      border-radius: 4px;
      color: var(--foreground);
      outline: none;
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--primary);
      }

      &:disabled {
        background-color: var(--grey-dark);
        border-color: var(--grey);
        color: var(--foreground-dark);
      }
    }

    .select {
      justify-self: start;
      width: 150px;
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

export const InterpolateNodeEditor: FC<InterpolateNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const interpolateNode = node as InterpolateNode;
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(interpolateNode);

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
      value: nodeLatest.current?.data.text,
      wordWrap: 'on',
    });
    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.({
        ...nodeLatest.current,
        data: {
          ...nodeLatest.current?.data,
          text: editor.getValue(),
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
      editorInstance.current.setValue(nodeLatest.current?.data.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  return (
    <Container>
      <div ref={editorContainer} className="editor-container" />
    </Container>
  );
};
