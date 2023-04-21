import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { PromptNode, PromptNodeData } from '../../model/nodes/PromptNode';
import styled from '@emotion/styled';
import { monaco } from '../../utils/monaco';

export type PromptNodeBodyProps = {
  node: PromptNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const PromptNodeBody: FC<PromptNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const truncated = useMemo(
    () =>
      node.data.promptText
        .split(' ')
        .reduce((acc, word) => {
          if (acc.length >= 100) {
            return acc;
          }
          if (acc.length + word.length >= 100) {
            return acc + '...';
          }
          return acc + ' ' + word;
        }, '')
        .split('\n')
        .slice(0, 8)
        .join('\n')
        .trim(),
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
        <em>{typeDisplay[node.data.type]}:</em>
      </div>
      <div ref={bodyRef} data-lang="prompt-interpolation">
        {truncated}
      </div>
    </Body>
  );
};

const typeDisplay: Record<PromptNodeData['type'], string> = {
  ai: 'AI',
  system: 'System',
  user: 'User',
};
