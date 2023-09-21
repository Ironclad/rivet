import Button from '@atlaskit/button';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import Portal from '@atlaskit/portal';
import { css } from '@emotion/react';
import { DatasetMetadata, DatasetRow, getError, newId } from '@ironclad/rivet-core';
import { FC } from 'react';
import { toast } from 'react-toastify';
import { useRecoilValue } from 'recoil';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useDataset } from '../../hooks/useDataset';
import { projectState } from '../../state/savedGraphs';
import { ioProvider } from '../../utils/globals';
import { stringify as stringifyCsv } from 'csv-stringify/browser/esm/sync';
import { parse as parseCsv } from 'csv-parse/browser/esm/sync';
import { DatasetTable } from './DatasetTable';

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

export const DatasetDisplay: FC<{
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

  const clearDataset = async () => {
    try {
      await datasetMethods.clearData();
    } catch (err) {
      toast.error(`Failed to clear dataset: ${getError(err).message}`);
    }
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
          <Button appearance="danger" onClick={clearDataset}>
            Clear Data
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
