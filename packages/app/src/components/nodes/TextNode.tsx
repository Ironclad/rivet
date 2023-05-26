import { FC, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { RenderDataValue } from '../RenderDataValue';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { useLatest } from 'ahooks';
import { css } from '@emotion/react';
import { ChartNode, PortId, TextNode, coerceType } from '@ironclad/nodai-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type TextNodeBodyProps = {
  node: TextNode;
};

const Body = styled.div`
  font-size: 12px;

  pre {
    white-space: pre-wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const TextNodeBody: FC<TextNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLPreElement>(null);

  const truncated = useMemo(() => node.data.text.split('\n').slice(0, 15).join('\n').trim(), [node.data.text]);

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'prompt-interpolation',
    });
  }, [truncated]);

  return (
    <Body>
      <pre ref={bodyRef} data-lang="prompt-interpolation">
        {truncated}
      </pre>
    </Body>
  );
};

const multiOutput = css`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TextNodeOutput: FC<TextNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>{output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputText = output.outputData['output' as PortId];

  if (outputText?.type === 'string[]') {
    return (
      <div css={multiOutput}>
        {outputText.value.map((s, i) => (
          <pre key={i} className="pre-wrap">
            {s}
          </pre>
        ))}
      </div>
    );
  }

  return <pre className="pre-wrap">{coerceType(outputText, 'string')}</pre>;
};

export type TextNodeEditorProps = {
  node: TextNode;
  onChange?: (node: TextNode) => void;
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

export const TextNodeEditor: FC<TextNodeEditorProps> = ({ node, onChange }) => {
  const editorContainer = useRef<HTMLDivElement>(null);
  const TextNode = node as TextNode;
  const editorInstance = useRef<monaco.editor.IStandaloneCodeEditor>();

  const onChangeLatest = useLatest(onChange);
  const nodeLatest = useLatest(TextNode);

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

export const textNodeDescriptor: NodeComponentDescriptor<'text'> = {
  Body: TextNodeBody,
  Output: TextNodeOutput,
  Editor: TextNodeEditor,
};
