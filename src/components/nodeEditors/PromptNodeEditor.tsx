import { FC, useEffect, useRef } from 'react';
import { ChartNode } from '../../model/NodeBase';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { PromptNode } from '../../model/nodes/PromptNode';
import { useLatest } from 'ahooks';

export type PromptNodeEditorProps = {
  node: ChartNode<string, unknown>;
  onChange?: (node: ChartNode<string, unknown>) => void;
};

const Container = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;

  .editor-container {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }
`;

export const PromptNodeEditor: FC<PromptNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const promptNode = node as PromptNode;
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(promptNode);

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

  return (
    <Container>
      <div ref={editorContainer} className="editor-container" />
    </Container>
  );
};
