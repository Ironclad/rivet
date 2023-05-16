import { FC } from 'react';
import { css } from '@emotion/react';
import { AssemblePromptNode, PortId, expectType } from '@ironclad/nodai-core';
import { useRecoilValue } from 'recoil';
import { lastRunData } from '../../state/dataFlow';
import { RenderDataValue } from '../RenderDataValue';

type AssemblePromptNodeBodyProps = {
  node: AssemblePromptNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const AssemblePromptNodeBody: FC<AssemblePromptNodeBodyProps> = ({ node }) => {
  return null;
};

export const AssemblePromptNodeOutput: FC<{ node: AssemblePromptNode }> = ({ node }) => {
  const output = useRecoilValue(lastRunData(node.id));

  if (!output) {
    return null;
  }

  if (output.status?.type === 'error') {
    return <div>Error: {output.status.error}</div>;
  }

  if (!output.outputData) {
    return null;
  }

  return (
    <div>
      <RenderDataValue value={output.outputData['prompt' as PortId]} />
    </div>
  );
};

export const assemblePromptNodeDescriptor = {
  Body: undefined,
  Output: AssemblePromptNodeOutput,
  Editor: undefined,
};
