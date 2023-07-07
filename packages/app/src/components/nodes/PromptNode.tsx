import { FC, memo, useLayoutEffect, useMemo, useRef } from 'react';
import { monaco } from '../../utils/monaco.js';
import styled from '@emotion/styled';
import { PromptNode, PromptNodeData } from '@ironclad/rivet-core';
import { NodeComponentDescriptor } from '../../hooks/useNodeTypes.js';

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
        <em>
          {typeDisplay[node.data.type]}
          {node.data.name ? ` (${node.data.name})` : ''}:
        </em>
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
  function: 'Function',
};

export const promptNodeDescriptor: NodeComponentDescriptor<'prompt'> = {
  Body: PromptNodeBody,
};
