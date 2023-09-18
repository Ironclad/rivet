import { FC, useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { overlayOpenState } from '../state/ui';
import { css } from '@emotion/react';
import { projectState } from '../state/savedGraphs';
import { ErrorBoundary } from 'react-error-boundary';
import useIndexedDb from '../hooks/useIndexedDb';
import { selectedDatasetState } from '../state/dataStudio';
import { toast } from 'react-toastify';
import { Dataset, DatasetId, DatasetMetadata, DatasetRow, getError, newId } from '@ironclad/rivet-core';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import clsx from 'clsx';
import Portal from '@atlaskit/portal';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useContextMenu } from '../hooks/useContextMenu';
import { stringify as stringifyCsv } from 'csv-stringify/browser/esm/sync';
import { parse as parseCsv } from 'csv-parse/browser/esm/sync';
import { ioProvider } from '../utils/globals';
import { useDataset } from '../hooks/useDataset';
import { useDatasets } from '../hooks/useDatasets';

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
    padding-top: 40px;
  }
`;

export const DataStudio: FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const project = useRecoilValue(projectState);
  const { datasets, ...datasetsMethods } = useDatasets(project.metadata.id);

  const [selectedDataset, setSelectedDataset] = useRecoilState(selectedDatasetState);
  const [renamingDataset, setRenamingDataset] = useState<DatasetId>();

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

  const selectedDatasetMeta = datasets?.find((d) => d.id === selectedDataset);

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu, setShowContextMenu } = useContextMenu();

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
    <div css={styles}>
      <div className="content">
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
                className="context-menu"
                css={contextMenuStyles}
                ref={contextMenuRef}
                style={{
                  zIndex: 500,
                  left: contextMenuData.x,
                  top: contextMenuData.y,
                }}
              >
                <DropdownItem onClick={() => setRenamingDataset(selectedDatasetForContextMenu?.id)}>
                  Rename
                </DropdownItem>
                <DropdownItem onClick={() => deleteDataset(selectedDatasetForContextMenu!)}>Delete</DropdownItem>
              </div>
            )}
          </Portal>
        </div>
        <div className="dataset-display-area">
          {selectedDatasetMeta && <DatasetDisplay dataset={selectedDatasetMeta} />}
        </div>
      </div>
    </div>
  );
};

const datasetStyles = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  cursor: pointer;

  &:hover {
    background-color: var(--grey-darkerish);
  }

  &.selected {
    background-color: var(--primary);
    color: var(--foreground-on-primary);
  }
`;

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

const DatasetListItem: FC<{
  dataset: DatasetMetadata;
  isSelected: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onRename: () => void;
  onUpdate: (dataset: DatasetMetadata) => void;
}> = ({ dataset, isSelected, isRenaming, onSelect, onRename, onUpdate }) => {
  return (
    <div
      css={datasetStyles}
      className={clsx('dataset', { selected: isSelected })}
      key={dataset.id}
      onClick={onSelect}
      onDoubleClick={onRename}
      data-contextmenutype="dataset"
      data-datasetid={dataset.id}
    >
      <div className="name">
        {isRenaming ? (
          <TextField
            autoFocus
            defaultValue={dataset.name}
            onBlur={(e) => onUpdate({ ...dataset, name: (e.target as HTMLInputElement).value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onUpdate({ ...dataset, name: (e.target as HTMLInputElement).value });
              }
            }}
          />
        ) : (
          <div>{dataset.name}</div>
        )}
      </div>
      <div className="buttons"></div>
    </div>
  );
};

const datasetDisplayStyles = css`
  padding: 16px;
  height: 100%;
  overflow: auto;

  header {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .dataset-table-container {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-auto-rows: auto;

    .add-column-area {
      min-height: 100px;
      width: 48px;

      button {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        color: var(--primary);
        cursor: pointer;

        span {
          transform: rotate(90deg);
        }

        &:hover {
          background-color: var(--grey-darkerish);
        }
      }
    }

    .add-row-area {
      min-height: 48px;

      button {
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        color: var(--primary);
        cursor: pointer;

        &:hover {
          background-color: var(--grey-darkerish);
        }
      }
    }
  }

  .dataset-table {
    border-collapse: collapse;
    width: 100%;
    border: 1px solid var(--grey);
    border-radius: 4px;

    td {
      border: 1px solid var(--grey);
      padding: 0;
      margin: 0;

      .cell {
        height: 48px;
      }

      .value {
        padding: 4px 8px;
        height: 100%;
        display: flex;
        align-items: center;
      }
    }
  }
`;

const DatasetDisplay: FC<{
  dataset: DatasetMetadata;
}> = ({ dataset }) => {
  const project = useRecoilValue(projectState);

  const { dataset: datasetData, ...datasetMethods } = useDataset(dataset.id);

  const { contextMenuData, contextMenuRef, handleContextMenu, showContextMenu } = useContextMenu();

  const updateDatasetData = async (data: DatasetRow[]) => {
    await datasetMethods.putDatasetData(data);
  };

  const selectedCellRow = contextMenuData.data?.type === 'cell' ? contextMenuData.data.element.dataset.row : undefined;
  const selectedCellColumn =
    contextMenuData.data?.type === 'cell' ? contextMenuData.data.element.dataset.column : undefined;

  const exportDataset = async () => {
    const csvContent = stringifyCsv(datasetData!.rows.map((row) => row.data));

    try {
      await ioProvider.saveString(csvContent, `${dataset.name}.csv`);
    } catch (err) {
      toast.error(`Failed to export dataset: ${getError(err).message}`);
    }
  };

  const importDataset = async () => {
    await ioProvider.readFileAsString(async (csvContent) => {
      try {
        const csvData = parseCsv(csvContent) as string[][];

        const data: DatasetRow[] = csvData.map((row) => ({
          id: newId(),
          data: row,
        }));

        datasetMethods.putDatasetData(data);
      } catch (err) {
        toast.error(`Failed to import dataset: ${getError(err).message}`);
      }
    });
  };

  return (
    <div
      css={datasetDisplayStyles}
      onContextMenu={(e) => {
        handleContextMenu(e);
        e.preventDefault();
      }}
      ref={contextMenuRef}
    >
      <header>
        <h1>{dataset.name}</h1>
        <div className="buttons">
          <Button appearance="primary" onClick={exportDataset}>
            Export Dataset
          </Button>
          <Button appearance="default" onClick={importDataset}>
            Import (Replace) Data
          </Button>
        </div>
      </header>
      {datasetData && <DatasetTable datasetData={datasetData.rows} onDataChanged={updateDatasetData} />}
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'cell' && (
          <div
            className="context-menu"
            css={contextMenuStyles}
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => datasetMethods.insertRowAbove(parseInt(selectedCellRow!, 10))}>
              Insert Row Above
            </DropdownItem>
            <DropdownItem onClick={() => datasetMethods.insertRowBelow(parseInt(selectedCellRow!, 10))}>
              Insert Row Below
            </DropdownItem>
            <DropdownItem onClick={() => datasetMethods.insertColumnLeft(parseInt(selectedCellColumn!, 10))}>
              Insert Column Left
            </DropdownItem>
            <DropdownItem onClick={() => datasetMethods.insertColumnRight(parseInt(selectedCellColumn!, 10))}>
              Insert Column Right
            </DropdownItem>
            <DropdownItem onClick={() => datasetMethods.deleteRow(parseInt(selectedCellRow!, 10))}>
              Delete Row
            </DropdownItem>
            <DropdownItem onClick={() => datasetMethods.deleteColumn(parseInt(selectedCellColumn!, 10))}>
              Delete Column
            </DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

const DatasetTable: FC<{
  datasetData: DatasetRow[];
  onDataChanged: (data: DatasetRow[]) => void;
}> = ({ datasetData, onDataChanged }) => {
  console.dir({ datasetData });
  return (
    <div className="dataset-table-container">
      <table className="dataset-table">
        <tbody>
          {datasetData.map((row, i) => (
            <tr key={i}>
              {row.data.map((cell, j) => (
                <td key={`${i}-${j}`}>
                  <DatasetEditableCell
                    value={cell}
                    row={i}
                    column={j}
                    onChange={(value) => {
                      const newData = [...datasetData];
                      newData[i]!.data[j] = value;
                      onDataChanged(newData);
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="add-column-area">
        <button
          onClick={() => {
            const newData = [...datasetData];
            newData.forEach((row) => row.data.push(''));
            onDataChanged(newData);
          }}
        >
          Add New Column
        </button>
      </div>
      <div className="add-row-area">
        <button
          onClick={() => {
            const newData = [...datasetData];
            console.dir({ newData: [...newData] });
            newData.push({
              id: newId(),
              data: Array(datasetData[0]?.data.length ?? 1).fill(''),
            });
            console.dir({ newData });
            onDataChanged(newData);
          }}
        >
          Add New Row
        </button>
      </div>
    </div>
  );
};

const DatasetEditableCell: FC<{
  value: string;
  row: number;
  column: number;
  onChange: (value: string) => void;
}> = ({ value, row, column, onChange }) => {
  const [editing, setEditing] = useState(false);

  return (
    <div className="cell" data-row={row} data-column={column} data-contextmenutype="cell">
      {editing ? (
        <TextField
          autoFocus
          defaultValue={value}
          onBlur={(e) => {
            onChange((e.target as HTMLInputElement).value);
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange((e.target as HTMLInputElement).value);
              setEditing(false);
            }
          }}
        />
      ) : (
        <div className="value" onDoubleClick={() => setEditing(true)}>
          {value}
        </div>
      )}
    </div>
  );
};
