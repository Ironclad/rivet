import { css } from '@emotion/react';
import { type FC } from 'react';

const styles = css`
  display: flex;
  flex-direction: column;
  background: var(--grey-dark);
  border: 1px solid var(--grey);
  flex: 1;
`;

export const CommunityTemplatesPage: FC = () => {
  return <div className="template-list"></div>;
};
