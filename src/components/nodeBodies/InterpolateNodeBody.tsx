import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { InterpolateNode } from '../../model/nodes/InterpolateNode';
import styled from '@emotion/styled';
import { monaco } from '../../utils/monaco';

export type InterpolateNodeBodyProps = {
  node: InterpolateNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const InterpolateNodeBody: FC<InterpolateNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const truncated = useMemo(
    () =>
      node.data.text
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
    [node.data.text],
  );

  useLayoutEffect(() => {
    monaco.editor.colorizeElement(bodyRef.current!, {
      theme: 'prompt-interpolation',
    });
  }, [truncated]);

  return (
    <Body>
      <div ref={bodyRef} data-lang="prompt-interpolation">
        {truncated}
      </div>
    </Body>
  );
};
