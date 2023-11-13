import Button from '@atlaskit/button';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import Portal from '@atlaskit/portal';
import { css } from '@emotion/react';
import {
  type DatasetMetadata,
  type DatasetRow,
  getError,
  newId,
  getIntegration,
  type DatasetId,
} from '@ironclad/rivet-core';
import { useState, type FC, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useDataset } from '../../hooks/useDataset';
import { datasetProvider, ioProvider } from '../../utils/globals';
import { stringify as stringifyCsv } from 'csv-stringify/browser/esm/sync';
import { parse as parseCsv } from 'csv-parse/browser/esm/sync';
import { DatasetTable } from './DatasetTable';
import Select from '@atlaskit/select';
import TextField from '@atlaskit/textfield';
import { useDebounce } from 'ahooks';
import useAsyncEffect from 'use-async-effect';
import { useGetAdHocInternalProcessContext } from '../../hooks/useGetAdHocInternalProcessContext';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { useDatasets } from '../../hooks/useDatasets';
import { useRecoilValue } from 'recoil';
import { projectMetadataState } from '../../state/savedGraphs';

const datasetDisplayStyles = css`
  padding: 16px;
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;

  header {
    padding-top: 40px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    h1 {
      flex: 1;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 20px;
      margin: 0;
      margin-right: 32px;

      form {
        flex: 1;
        margin: 0;
      }

      form > div {
        margin: 0;
      }
    }

    .buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .searchKnn {
      display: flex;
      align-items: center;
      gap: 0;

      .searchInput {
      }

      .embeddingProvider {
        min-width: 100px;
      }
    }
  }

  .table-viewer {
    overflow: auto;
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

const embeddingProviders = [{ value: 'openai', label: 'OpenAI' }] as const;

export type DatasetRowWithDistance = DatasetRow & {
  distance?: number;
};

export const DatasetDisplay: FC<{
  dataset: DatasetMetadata;
  onChangedId?: (id: DatasetId) => void;
}> = ({ dataset, onChangedId }) => {
  const { dataset: datasetData, ...datasetMethods } = useDataset(dataset.id);

  const projectMetadata = useRecoilValue(projectMetadataState);
  const datasetsMethods = useDatasets(projectMetadata.id);

  const { contextMenuData, contextMenuRef, handleContextMenu, showContextMenu } = useContextMenu();

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

  const [knnEmbeddingProvider, setKnnEmbeddingProvider] =
    useState<(typeof embeddingProviders)[number]['value']>('openai');

  const [knnSearch, setKnnSearch] = useState('');

  const debouncedKnnSearch = useDebounce(knnSearch, { wait: 500 });
  const getAdHocInternalProcessContext = useGetAdHocInternalProcessContext();

  const [filteredRows, setFilteredRows] = useState<DatasetRowWithDistance[] | undefined>(undefined);

  useAsyncEffect(async () => {
    if (debouncedKnnSearch.trim().length === 0) {
      setFilteredRows(undefined);
      return;
    }

    try {
      const provider = getIntegration(
        'embeddingGenerator',
        knnEmbeddingProvider,
        await getAdHocInternalProcessContext(),
      );
      const embedding = await provider.generateEmbedding(debouncedKnnSearch);
      const knn = await datasetProvider.knnDatasetRows(dataset.id, 1000, embedding);

      setFilteredRows(knn);
    } catch (err) {
      toast.error(`Failed to generate embedding: ${getError(err).message}`);
      setFilteredRows(undefined);
    }
  }, [debouncedKnnSearch, knnEmbeddingProvider, dataset.id]);

  const updateDatasetData = async (data: DatasetRow[]) => {
    // Safeguard because filtering gets nearest 1000, but if dataset is bigger than that, the putDatasetData will lose rows
    if (filteredRows && filteredRows.length < datasetData!.rows.length) {
      throw new Error('Too many rows to update while filtering, sorry!');
    }

    await datasetMethods.putDatasetData(data);
  };

  // Clear search when switching datasets
  useEffect(() => {
    setKnnSearch('');
    setFilteredRows(undefined);
  }, [dataset.id]);

  const renameDataset = async (name: string) => {
    await datasetsMethods.putDataset({ ...dataset, name });
  };

  const setDatasetId = async (id: string) => {
    await datasetsMethods.putDataset({ ...dataset, id: id as DatasetId });
    await datasetsMethods.deleteDataset(dataset.id);
    onChangedId?.(id as DatasetId);
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
        <h1>
          Dataset:
          <InlineEditableTextfield
            defaultValue={dataset.name}
            placeholder="Dataset Name"
            onConfirm={(newName) => renameDataset(newName)}
            readViewFitContainerWidth
          />
          ID:
          <InlineEditableTextfield
            defaultValue={dataset.id}
            placeholder="Dataset ID"
            onConfirm={(newId) => setDatasetId(newId)}
            readViewFitContainerWidth
          />
        </h1>
        <div className="buttons">
          <div className="searchKnn">
            <TextField
              className="searchInput"
              type="text"
              placeholder="Search KNN"
              value={knnSearch}
              onChange={(e) => setKnnSearch((e.target as HTMLInputElement).value)}
            />

            <Select
              className="embeddingProvider"
              options={embeddingProviders}
              value={embeddingProviders.find((p) => p.value === knnEmbeddingProvider)}
              placeholder="Embedding Provider"
            />
          </div>
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
      <div className="table-viewer">
        {datasetData && (
          <DatasetTable datasetData={filteredRows ?? datasetData.rows} onDataChanged={updateDatasetData} />
        )}
      </div>
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
