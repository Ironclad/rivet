import Button from '@atlaskit/button';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import Portal from '@atlaskit/portal';
import { type DatasetId, type DatasetMetadata, newId, getError } from '@ironclad/rivet-core';
import { type FC, useState } from 'react';
import { toast } from 'react-toastify';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useDatasets } from '../../hooks/useDatasets';
import { selectedDatasetState } from '../../state/dataStudio';
import { projectState } from '../../state/savedGraphs';
import { DatasetListItem } from './DatasetListItem';
import { css } from '@emotion/react';
import { autoUpdate, shift, useFloating } from '@floating-ui/react';

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;

  > button span {
    // This fixes a bug in Ubuntu where the text is missing
    overflow-x: visible !important;
  }
`;

export const DatasetList: FC<{}> = () => {
  const [selectedDataset, setSelectedDataset] = useRecoilState(selectedDatasetState);
  const {
    refs,
    floatingStyles,
    contextMenuRef,
    showContextMenu,
    contextMenuData,
    handleContextMenu,
    setShowContextMenu,
  } = useContextMenu();
  const [renamingDataset, setRenamingDataset] = useState<DatasetId>();

  const project = useRecoilValue(projectState);
  const { datasets, ...datasetsMethods } = useDatasets(project.metadata.id);

  const newDataset = async () => {
    const metadata: DatasetMetadata = {
      id: newId<DatasetId>(),
      projectId: project.metadata.id,
      name: 'New Dataset',
      description: '',
    };

    try {
      await datasetsMethods.putDataset(metadata);
      setRenamingDataset(metadata.id);
    } catch (err) {
      toast.error(`Failed to create dataset: ${getError(err).message}`);
    }
  };

  const updateDataset = async (dataset: DatasetMetadata) => {
    try {
      await datasetsMethods.putDataset(dataset);
    } catch (err) {
      toast.error(`Failed to update dataset: ${getError(err).message}`);
    }
  };

  const selectedDatasetForContextMenu =
    contextMenuData.data?.type === 'dataset'
      ? datasets?.find((set) => set.id === contextMenuData.data!.element.dataset.datasetid)
      : undefined;

  const deleteDataset = async (dataset: DatasetMetadata) => {
    setShowContextMenu(false);
    try {
      await datasetsMethods.deleteDataset(dataset.id);
    } catch (err) {
      toast.error(`Failed to delete dataset: ${getError(err).message}`);
    }
  };

  return (
    <div
      className="left-sidebar"
      onContextMenu={(e) => {
        handleContextMenu(e);
        e.preventDefault();
      }}
    >
      <header>
        <h2>Datasets</h2>
        <Button appearance="primary" onClick={newDataset}>
          +
        </Button>
      </header>
      <div className="datasets-list">
        {(datasets ?? []).map((dataset) => (
          <DatasetListItem
            key={dataset.id}
            dataset={dataset}
            isSelected={dataset.id === selectedDataset}
            isRenaming={dataset.id === renamingDataset}
            onSelect={() => setSelectedDataset(dataset.id)}
            onRename={() => setRenamingDataset(dataset.id)}
            onUpdate={(updated) => {
              updateDataset(updated);
              setRenamingDataset(undefined);
            }}
          />
        ))}
      </div>
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'dataset' && (
          <div
            ref={refs.setReference}
            style={{
              position: 'absolute',
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <div ref={refs.setFloating} style={floatingStyles} css={contextMenuStyles}>
              <DropdownItem onClick={() => setRenamingDataset(selectedDatasetForContextMenu?.id)}>Rename</DropdownItem>
              <DropdownItem onClick={() => deleteDataset(selectedDatasetForContextMenu!)}>Delete</DropdownItem>
            </div>
          </div>
        )}
      </Portal>
    </div>
  );
};
