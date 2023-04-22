import { FC } from 'react';
import { MatchNode } from '../../model/nodes/MatchNode';
import { css } from '@emotion/react';
import { lastRunData } from '../../state/dataFlow';
import { useRecoilValue } from 'recoil';
import { RenderDataValue } from '../RenderDataValue';

type MatchNodeBodyProps = {
  node: MatchNode;
};

const styles = css`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MatchNodeBody: FC<MatchNodeBodyProps> = ({ node }) => {
  return (
    <div css={styles}>
      <div>Case Count: {node.data.caseCount}</div>
      {node.data.cases.map((caseRegex, index) => (
        <div key={index}>
          Case {index + 1}: {caseRegex}
        </div>
      ))}
    </div>
  );
};

export const MatchNodeOutput: FC<MatchNodeBodyProps> = ({ node }) => {
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

  return (
    <div>
      {Object.entries(output.outputData).map(([key, value]) => (
        <div key={key}>
          {key}: <RenderDataValue value={value} />
        </div>
      ))}
    </div>
  );
};
