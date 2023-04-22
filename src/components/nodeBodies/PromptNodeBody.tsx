import { FC, useLayoutEffect, useMemo, useRef } from 'react';
import { PromptNode, PromptNodeData } from '../../model/nodes/PromptNode';
import styled from '@emotion/styled';
import { monaco } from '../../utils/monaco';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { PortId } from '../../model/NodeBase';
import { GetDataValue } from '../../model/DataValue';
import { RenderDataValue } from '../RenderDataValue';

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
        .split('\n')
        .slice(0, 15)
        .map((line) => {
          const words = line.split(' ');
          if (words.length > 50) {
            return words.slice(0, 50).join(' ') + '...';
          }
          return line;
        })
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
  assistant: 'AI',
  system: 'System',
  user: 'User',
};

export const PromptNodeOutput: FC<PromptNodeBodyProps> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.status === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  const message = output.outputData?.['output' as PortId] as GetDataValue<'chat-message'> | undefined;

  if (message == null) {
    return null;
  }

  if (message.type !== 'chat-message') {
    return <RenderDataValue value={message} />;
  }

  return (
    <div>
      <em>{typeDisplay[message.value.type]}:</em>
      <div className="pre-wrap">{message.value.message}</div>
    </div>
  );
};
