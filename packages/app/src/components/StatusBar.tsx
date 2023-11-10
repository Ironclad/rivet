import { useState, type FC, useRef, useEffect } from 'react';
import { css } from '@emotion/react';
import { useTotalRunCost } from '../hooks/useTotalRunCost';
import { useRecoilValue } from 'recoil';
import { graphRunningState, graphStartTimeState } from '../state/dataFlow';
import { useInterval, useLatest } from 'ahooks';
import prettyMs from 'pretty-ms';

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
  const graphRunning = useRecoilValue(graphRunningState);
  const graphStartTime = useRecoilValue(graphStartTimeState);

  const runtimeRef = useRef<HTMLDivElement>(null);
  const latestGraphRunning = useLatest(graphRunning);
  const latestGraphStartTime = useLatest(graphStartTime);

  useEffect(() => {
    const fn = () => {
      if (latestGraphRunning.current && latestGraphStartTime.current != null) {
        const duration = prettyMs(Date.now() - latestGraphStartTime.current, {
          keepDecimalsOnWholeSeconds: true,
          secondsDecimalDigits: 2,
        });
        runtimeRef.current!.innerText = duration;
        requestAnimationFrame(fn);
      }
    };
    requestAnimationFrame(fn);
  }, [graphRunning, graphStartTime, latestGraphRunning, latestGraphStartTime]);

  return (
    <div css={styles}>
      {(graphStartTime ?? 0) > 0 && (
        <div className="runtime">
          Runtime: <strong ref={runtimeRef}></strong>
        </div>
      )}
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
