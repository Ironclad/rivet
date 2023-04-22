import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { CodeNode } from '../../model/nodes/CodeNode';
import styled from '@emotion/styled';
import { monaco } from '../../utils/monaco';
import { RenderDataValue } from '../RenderDataValue';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';

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
  node: CodeNode;
};

export const CodeNodeOutput: FC<CodeNodeOutputProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.status === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  const outputValues = Object.entries(output.outputData).map(([key, value]) => (
    <div key={key}>
      {key}: <RenderDataValue value={value} />
    </div>
  ));

  return <pre>{outputValues}</pre>;
};
