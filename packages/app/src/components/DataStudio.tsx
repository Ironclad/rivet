import { FC, useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { overlayOpenState } from '../state/ui';
import { css } from '@emotion/react';
import { projectState } from '../state/savedGraphs';
import { ErrorBoundary } from 'react-error-boundary';
import useIndexedDb from '../hooks/useIndexedDb';
import { Dataset, DatasetData, DatasetId, DatasetMetadata, selectedDatasetState } from '../state/dataStudio';
import { toast } from 'react-toastify';
import { getError, newId } from '@ironclad/rivet-core';
import Button from '@atlaskit/button';
import TextField from '@atlaskit/textfield';
import clsx from 'clsx';
import Portal from '@atlaskit/portal';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { useContextMenu } from '../hooks/useContextMenu';

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
  const datasetsStore = useIndexedDb<DatasetMetadata>({ dbName: 'datasets', storeName: 'datasets' });

  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);

  const [selectedDataset, setSelectedDataset] = useRecoilState(selectedDatasetState);
  const [renamingDataset, setRenamingDataset] = useState<DatasetId>();

  useEffect(() => {
    (async () => {
      try {
        const allDatasets = await datasetsStore.getAll();
        setDatasets(allDatasets);
      } catch (err) {
        toast.error(`Failed to load datasets: ${getError(err).message}`);
      }
    })();
  }, []);

  const newDataset = async () => {
    const metadata: DatasetMetadata = {
      id: newId<DatasetId>(),
      name: 'New Dataset',
      description: '',
    };

    setDatasets([...datasets, metadata]);

    try {
      await datasetsStore.put(metadata.id, metadata);
    } catch (err) {
      toast.error(`Failed to create dataset: ${getError(err).message}`);
    }

    setRenamingDataset(metadata.id);
  };

  const updateDataset = async (dataset: DatasetMetadata) => {
    setDatasets(datasets.map((d) => (d.id === dataset.id ? dataset : d)));

    try {
      await datasetsStore.put(dataset.id, dataset);
    } catch (err) {
      toast.error(`Failed to update dataset: ${getError(err).message}`);
    }
  };

  const selectedDatasetMeta = datasets.find((d) => d.id === selectedDataset);

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const selectedDatasetForContextMenu =
    contextMenuData.data?.type === 'dataset'
      ? datasets.find((set) => set.id === contextMenuData.data!.element.dataset.datasetid)
      : undefined;

  const deleteDataset = async (dataset: DatasetMetadata) => {
    setDatasets(datasets.filter((d) => d.id !== dataset.id));

    try {
      await datasetsStore.delete(dataset.id);
    } catch (err) {
      toast.error(`Failed to delete dataset: ${getError(err).message}`);
    }
  };

  return (
    <div css={styles}>
      <div className="content">
        <div
          className="left-sidebar"
          ref={contextMenuRef}
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
            {datasets.map((dataset) => (
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
                className="graph-item-context-menu"
                css={contextMenuStyles}
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
  const datasetDatabase = useIndexedDb<DatasetData>({ dbName: `dataset-data-${dataset.id}`, storeName: 'data' });

  const [datasetData, setDatasetData] = useState<Dataset | undefined>();

  const { contextMenuData, contextMenuRef, handleContextMenu, showContextMenu } = useContextMenu();

  useEffect(() => {
    (async () => {
      try {
        const data = await datasetDatabase.getAll();
        setDatasetData({
          id: dataset.id,
          data,
        });
      } catch (err) {
        toast.error(`Failed to load dataset: ${getError(err).message}`);
      }
    })();
  }, []);

  const updateDatasetData = async (dataset: Dataset) => {
    setDatasetData(dataset);

    try {
      for (const row of dataset.data) {
        await datasetDatabase.put(row.id, row);
      }
    } catch (err) {
      toast.error(`Failed to update dataset: ${getError(err).message}`);
    }
  };

  const selectedCellRow = contextMenuData.data?.type === 'cell' ? contextMenuData.data.element.dataset.row : undefined;
  const selectedCellColumn =
    contextMenuData.data?.type === 'cell' ? contextMenuData.data.element.dataset.column : undefined;

  const deleteRow = (row: number) => {
    const newData = [...datasetData!.data];
    newData.splice(row, 1);
    updateDatasetData({
      ...datasetData!,
      data: newData,
    });
  };

  const deleteColumn = (column: number) => {
    const newData = [...datasetData!.data];
    newData.forEach((row) => row.data.splice(column, 1));
    updateDatasetData({
      ...datasetData!,
      data: newData,
    });
  };

  const insertRowAbove = (row: number) => {
    const newData = [...datasetData!.data];
    newData.splice(row, 0, {
      id: newId(),
      data: Array(datasetData!.data[0]?.data.length ?? 1).fill(''),
    });
    updateDatasetData({
      ...datasetData!,
      data: newData,
    });
  };

  const insertRowBelow = (row: number) => {
    const newData = [...datasetData!.data];
    newData.splice(row + 1, 0, {
      id: newId(),
      data: Array(datasetData!.data[0]?.data.length ?? 1).fill(''),
    });
    updateDatasetData({
      ...datasetData!,
      data: newData,
    });
  };

  const insertColumnLeft = (column: number) => {
    const newData = [...datasetData!.data];
    newData.forEach((row) => row.data.splice(column, 0, ''));
    updateDatasetData({
      ...datasetData!,
      data: newData,
    });
  };

  const insertColumnRight = (column: number) => {
    const newData = [...datasetData!.data];
    newData.forEach((row) => row.data.splice(column + 1, 0, ''));
    updateDatasetData({
      ...datasetData!,
      data: newData,
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
      </header>
      {datasetData && <DatasetTable dataset={datasetData} setDatasetData={updateDatasetData} />}
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'cell' && (
          <div
            className="graph-item-context-menu"
            css={contextMenuStyles}
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={() => insertRowAbove(parseInt(selectedCellRow!, 10))}>Insert Row Above</DropdownItem>
            <DropdownItem onClick={() => insertRowBelow(parseInt(selectedCellRow!, 10))}>Insert Row Below</DropdownItem>
            <DropdownItem onClick={() => insertColumnLeft(parseInt(selectedCellColumn!, 10))}>
              Insert Column Left
            </DropdownItem>
            <DropdownItem onClick={() => insertColumnRight(parseInt(selectedCellColumn!, 10))}>
              Insert Column Right
            </DropdownItem>
            <DropdownItem onClick={() => deleteRow(parseInt(selectedCellRow!, 10))}>Delete Row</DropdownItem>
            <DropdownItem onClick={() => deleteColumn(parseInt(selectedCellColumn!, 10))}>Delete Column</DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

const DatasetTable: FC<{
  dataset: Dataset;
  setDatasetData: (dataset: Dataset) => void;
}> = ({ dataset, setDatasetData }) => {
  const { data } = dataset;

  return (
    <div className="dataset-table-container">
      <table className="dataset-table">
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {row.data.map((cell, j) => (
                <td key={`${i}-${j}`}>
                  <DatasetEditableCell
                    value={cell}
                    row={i}
                    column={j}
                    onChange={(value) => {
                      const newData = [...data];
                      newData[i]!.data[j] = value;
                      setDatasetData({
                        ...dataset,
                        data: newData,
                      });
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
            const newData = [...data];
            newData.forEach((row) => row.data.push(''));
            setDatasetData({
              ...dataset,
              data: newData,
            });
          }}
        >
          Add New Column
        </button>
      </div>
      <div className="add-row-area">
        <button
          onClick={() => {
            const newData = [...data];
            newData.push({
              id: newId(),
              data: Array(data[0]?.data.length ?? 1).fill(''),
            });
            setDatasetData({
              ...dataset,
              data: newData,
            });
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
