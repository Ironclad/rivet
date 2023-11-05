import { css } from '@emotion/react';
import { useEffect, type FC, useState } from 'react';
import { lastMousePositionState } from '../state/graphBuilder';
import { useRecoilValue } from 'recoil';

const styles = css`
  position: fixed;
  pointer-events: none;
  z-index: 9999;

  .selection-box-indicator {
    width: 24px;
    height: 24px;
    border: 2px dashed var(--primary);
  }
`;

export const MouseIcon: FC = () => {
  const lastMousePosition = useRecoilValue(lastMousePositionState);
  const [shiftPressed, setShiftPressed] = useState(false);

  const offset = {
    left: 15,
    top: 15,
  };

  useEffect(() => {
    const pressHandler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
      }
    };
    const releaseHandler = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    window.addEventListener('keydown', pressHandler);
    window.addEventListener('keyup', releaseHandler);

    return () => {
      window.removeEventListener('keydown', pressHandler);
      window.removeEventListener('keyup', releaseHandler);
    };
  }, []);

  const icon =
    shiftPressed && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName ?? '') ? (
      <div className="selection-box-indicator" />
    ) : null;

  if (!icon) {
    return null;
  }

  return (
    <div css={styles} style={{ left: lastMousePosition.x + offset.left, top: lastMousePosition.y + offset.top }}>
      {icon}
    </div>
  );
};
