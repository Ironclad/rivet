import { FC, useLayoutEffect, useMemo, useEffect, useRef } from 'react';
import { CodeNode, Outputs } from '@ironclad/nodai-core';
import { monaco } from '../../utils/monaco';
import { RenderDataValue } from '../RenderDataValue';
import styled from '@emotion/styled';
import { useLatest } from 'ahooks';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type CodeNodeBodyProps = {
  node: CodeNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const CodeNodeBody: FC<CodeNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLPreElement>(null);

  const truncated = useMemo(
    () =>
      node.data.code
        .split('\n')
        .slice(0, 15)
        .map((line) => (line.length > 50 ? line.slice(0, 50) + '...' : line))
        .join('\n')
        .trim(),
    [node.data.code],
  );

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'vs-dark',
    });
  }, [truncated]);

  return (
    <Body>
      <pre ref={bodyRef} data-lang="javascript">
        {truncated}
      </pre>
    </Body>
  );
};

export type CodeNodeOutputProps = {
  outputs: Outputs;
};

export const CodeNodeOutput: FC<CodeNodeOutputProps> = ({ outputs }) => {
  const outputValues = Object.entries(outputs).map(([key, value]) => (
    <div key={key}>
      {key}: <RenderDataValue value={value} />
    </div>
  ));

  return <pre>{outputValues}</pre>;
};

export type CodeNodeEditorProps = {
  node: CodeNode;
  onChange?: (node: CodeNode) => void;
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;

  .editor-container {
    flex: 1;
    min-height: 400px;
  }
`;

export const CodeNodeEditor: FC<CodeNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const codeNode = node as CodeNode;
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(codeNode);

  useEffect(() => {
    if (!editorContainer.current) {
      return;
    }

    const editor = monaco.editor.create(editorContainer.current, {
      theme: 'vs-dark',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      lineNumbersMinChars: 2,
      language: 'javascript',
      minimap: {
        enabled: false,
      },
      value: nodeLatest.current?.data.code,
    });
    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.({
        ...nodeLatest.current,
        data: {
          ...nodeLatest.current?.data,
          code: editor.getValue(),
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
      editorInstance.current.setValue(nodeLatest.current?.data.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  return (
    <Container>
      <div ref={editorContainer} className="editor-container" />
    </Container>
  );
};

export const codeNodeDescriptor: NodeComponentDescriptor<'code'> = {
  Body: CodeNodeBody,
  OutputSimple: CodeNodeOutput,
  Editor: CodeNodeEditor,
};
