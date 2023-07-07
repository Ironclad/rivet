import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { monaco } from '../../utils/monaco';
import styled from '@emotion/styled';
import { ObjectNode } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes';

export type ObjectNodeBodyProps = {
  node: ObjectNode;
};

const Body = styled.div`
  font-size: 12px;

  pre {
    white-space: pre-wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const ObjectNodeBody: FC<ObjectNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLPreElement>(null);

  const truncated = useMemo(() => node.data.jsonTemplate.split('\n').slice(0, 15).join('\n').trim(), [node.data.jsonTemplate]);

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'prompt-interpolation',
    });
  }, [truncated]);

  return (
    <Body>
      <pre ref={bodyRef} data-lang="json">
        {truncated}
      </pre>
    </Body>
  );
};

export const ObjectNodeDescriptor: NodeComponentDescriptor<'object'> = {
  Body: ObjectNodeBody,
};
