import { type FC } from 'react';
import { css } from '@emotion/react';
import { useTotalRunCost } from '../hooks/useTotalRunCost';

const styles = css`
  position: fixed;
  bottom: 8px;
  right: 8px;
  height: 32px;
  width: auto;
  background: var(--grey-darker);
  border-top: 1px solid var(--grey-dark);
  color: var(--grey-light);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  z-index: 50;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  gap: 16px;
  font-size: 0.8rem;
  border-radius: 5px;
`;

export const StatusBar: FC<{}> = () => {
  const { cost, tokens } = useTotalRunCost();

  if (!cost && !tokens) {
    return null;
  }

  return (
    <div css={styles}>
      {tokens > 0 && (
        <div className="tokens">
          Tokens: <strong>{tokens.toLocaleString()}</strong>
        </div>
      )}
      {cost > 0 && (
        <div className="cost">
          Run Cost: <strong>${parseFloat(cost.toFixed(3)).toLocaleString()}</strong>
        </div>
      )}
    </div>
  );
};
