import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { TextNode } from '@ironclad/nodai-core';
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

export const textNodeDescriptor: NodeComponentDescriptor<'text'> = {
  Body: TextNodeBody,
};
