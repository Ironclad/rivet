import { type FC } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { css } from '@emotion/react';
import { ErrorBoundary } from 'react-error-boundary';
import { useDatasets } from '../../hooks/useDatasets';
import { selectedDatasetState } from '../../state/dataStudio';
import { projectState } from '../../state/savedGraphs';
import { overlayOpenState } from '../../state/ui';
import { DatasetList } from './DatasetList';
import { DatasetDisplay } from './DatasetDisplay';

export const DataStudioRenderer: FC = () => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'dataStudio') return null;

  return (
    <ErrorBoundary onError={(err) => console.error(err)} fallbackRender={() => 'Failed to render Data Studio'}>
      <DataStudio onClose={() => setOpenOverlay(undefined)} />
    </ErrorBoundary>
  );
};

const styles = css`
  position: fixed;
  top: var(--project-selector-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  z-index: 150;
  overflow: auto;

  .content {
    display: grid;
    grid-template-columns: 300px 1fr;
    height: 100%;
  }

  .left-sidebar {
    user-select: none;
    left: 0;
    height: 100%;
    background-color: var(--grey-darker);
    border-right: 1px solid var(--grey);
    z-index: 2;

    header {
      padding: 8px 16px;
      border-bottom: 1px solid var(--grey);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .dataset-display-area {
    overflow: hidden;
  }
`;

export const DataStudio: FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [selectedDataset, setSelectedDataset] = useRecoilState(selectedDatasetState);

  const project = useRecoilValue(projectState);
  const { datasets } = useDatasets(project.metadata.id);

  const selectedDatasetMeta = datasets?.find((d) => d.id === selectedDataset);

  return (
    <div css={styles}>
      <div className="content">
        <DatasetList />

        <div className="dataset-display-area">
          {selectedDatasetMeta && <DatasetDisplay dataset={selectedDatasetMeta} onChangedId={setSelectedDataset} />}
        </div>
      </div>
    </div>
  );
};
