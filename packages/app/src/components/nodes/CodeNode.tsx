import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { CodeNode, Outputs } from '@ironclad/rivet-core';
import { monaco } from '../../utils/monaco';
import { RenderDataValue } from '../RenderDataValue';
import styled from '@emotion/styled';
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

export const codeNodeDescriptor: NodeComponentDescriptor<'code'> = {
  Body: CodeNodeBody,
  OutputSimple: CodeNodeOutput,
};
