import { FC, useRef } from 'react';
import { ExtractRegexNode } from '../../model/nodes/ExtractRegexNode';
import styled from '@emotion/styled';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { PortId } from '../../model/NodeBase';
import { RenderDataValue } from '../RenderDataValue';

export type ExtractRegexNodeBodyProps = {
  node: ExtractRegexNode;
};

const Body = styled.div`
  font-size: 12px;
`;

export const ExtractRegexNodeBody: FC<ExtractRegexNodeBodyProps> = ({ node }) => {
  const bodyRef = useRef<HTMLDivElement>(null);

  const regex = node.data.regex;

  // TODO regex highlight?
  // useLayoutEffect(() => {
  //   monaco.editor.colorizeElement(bodyRef.current!, {
  //     theme: 'prompt-interpolation',
  //   });
  // }, [truncated]);

  if (node.data.useRegexInput) {
    return <Body>(Using regex input)</Body>;
  }

  return <Body>{node.data.regex}</Body>;
};

export const ExtractRegexNodeOutput: FC<ExtractRegexNodeBodyProps> = ({ node }) => {
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

  const outputText = output.outputData['output' as PortId];
  return (
    <pre>
      <RenderDataValue value={outputText} />
    </pre>
  );
};
