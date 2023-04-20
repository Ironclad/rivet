import { FC, useEffect, useMemo, useRef } from 'react';
import { PromptNode } from '../../model/nodes/PromptNode';
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

  useEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'prompt-interpolation',
    });
  }, []);

  return (
    <Body ref={bodyRef} data-lang="prompt-interpolation">
      {truncated}
    </Body>
  );
};
