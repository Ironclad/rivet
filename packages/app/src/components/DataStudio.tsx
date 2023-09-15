import { FC } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { overlayOpenState } from '../state/ui';
import { css } from '@emotion/react';
import { projectState } from '../state/savedGraphs';
import { ErrorBoundary } from 'react-error-boundary';

export const DataStudioRenderer: FC = () => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'dataStudio') return null;

  return (
    <ErrorBoundary fallback={null}>
      <DataStudio onClose={() => setOpenOverlay(undefined)} />
    </ErrorBoundary>
  );
};

const styles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  z-index: 60;
  overflow: auto;
`;

export const DataStudio: FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const project = useRecoilValue(projectState);

  return <div css={styles}></div>;
};
