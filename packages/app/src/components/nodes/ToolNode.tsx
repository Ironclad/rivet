import { FC, useEffect, useRef } from 'react';
import { ToolNode, Outputs } from '@ironclad/nodai-core';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { useLatest } from 'ahooks';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';
import { Field } from '@atlaskit/form';
import TextField from '@atlaskit/textfield';

export type ToolNodeBodyProps = {
  node: ToolNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const ToolNodeBody: FC<ToolNodeBodyProps> = ({ node }) => {
  return (
    <Body>
      <pre className="pre-wrap">
        <em>{node.data.name}</em>: {node.data.description}
      </pre>
    </Body>
  );
};

export type ToolNodeOutputProps = {
  outputs: Outputs;
};

export type ToolNodeEditorProps = {
  node: ToolNode;
  onChange?: (node: ToolNode) => void;
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

export const ToolNodeEditor: FC<ToolNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const ToolNode = node as ToolNode;
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(ToolNode);

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
      language: 'json',
      minimap: {
        enabled: false,
      },
      value: nodeLatest.current?.data.schema,
    });
    editor.onDidChangeModelContent(() => {
      onChangeLatest.current?.({
        ...nodeLatest.current,
        data: {
          ...nodeLatest.current?.data,
          schema: editor.getValue(),
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
      editorInstance.current.setValue(nodeLatest.current?.data.schema);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  return (
    <Container>
      <div>
        <Field label="Name" name="name">
          {({ fieldProps }) => (
            <TextField
              {...fieldProps}
              value={node.data.name}
              onChange={(e) =>
                onChange?.({
                  ...node,
                  data: {
                    ...node.data,
                    name: (e.target as HTMLInputElement).value,
                  },
                })
              }
            />
          )}
        </Field>
        <Field label="Description" name="description">
          {({ fieldProps }) => (
            <TextField
              {...fieldProps}
              value={node.data.description}
              onChange={(e) =>
                onChange?.({
                  ...node,
                  data: {
                    ...node.data,
                    description: (e.target as HTMLInputElement).value,
                  },
                })
              }
            />
          )}
        </Field>
      </div>
      <div ref={editorContainer} className="editor-container" />
    </Container>
  );
};

export const toolNodeDescriptor: NodeComponentDescriptor<'tool'> = {
  Body: ToolNodeBody,
  Editor: ToolNodeEditor,
};
