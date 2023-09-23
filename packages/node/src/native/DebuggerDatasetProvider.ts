import {
  type CombinedDataset,
  type Dataset,
  type DatasetId,
  type DatasetMetadata,
  type DatasetProvider,
  type DatasetRow,
  type ProjectId,
  newId,
} from '@ironclad/rivet-core';

export class DebuggerDatasetProvider implements DatasetProvider {
  listeners: Record<string, (payload: any) => void> = {};

  onrequest: ((type: string, data: any) => void) | undefined;

  handleResponse(type: string, data: any) {
    const { requestId, payload } = data;

    if (type === 'datasets:response') {
      const listener = this.listeners[requestId];
      if (listener) {
        listener(payload);
      }
    }
  }

  makeRequestAndWaitForResponse<T>(type: `datasets:${string}`, data: any): Promise<T> {
    const requestId = newId();

    const waitingPromise = new Promise<T>((resolve) => {
      this.listeners[requestId] = (response: any) => {
        delete this.listeners[requestId];
        resolve(response);
      };
    });

    this.onrequest?.(type, { requestId, payload: data });

    return waitingPromise;
  }

  getDatasetMetadata(id: DatasetId): Promise<DatasetMetadata | undefined> {
    return this.makeRequestAndWaitForResponse(`datasets:get-metadata`, { id });
  }

  getDatasetsForProject(projectId: ProjectId): Promise<DatasetMetadata[]> {
    return this.makeRequestAndWaitForResponse(`datasets:get-for-project`, { projectId });
  }

  getDatasetData(id: DatasetId): Promise<Dataset> {
    return this.makeRequestAndWaitForResponse(`datasets:get-data`, { id });
  }

  putDatasetData(id: DatasetId, data: Dataset): Promise<void> {
    return this.makeRequestAndWaitForResponse(`datasets:put-data`, { id, data });
  }

  putDatasetRow(id: DatasetId, row: DatasetRow): Promise<void> {
    return this.makeRequestAndWaitForResponse(`datasets:put-row`, { id, row });
  }

  putDatasetMetadata(metadata: DatasetMetadata): Promise<void> {
    return this.makeRequestAndWaitForResponse(`datasets:put-metadata`, { metadata });
  }

  clearDatasetData(id: DatasetId): Promise<void> {
    return this.makeRequestAndWaitForResponse(`datasets:clear-data`, { id });
  }

  deleteDataset(id: DatasetId): Promise<void> {
    return this.makeRequestAndWaitForResponse(`datasets:delete`, { id });
  }

  knnDatasetRows(
    datasetId: DatasetId,
    k: number,
    vector: number[],
  ): Promise<(DatasetRow & { distance?: number | undefined })[]> {
    return this.makeRequestAndWaitForResponse(`datasets:knn`, { datasetId, k, vector });
  }

  exportDatasetsForProject(projectId: ProjectId): Promise<CombinedDataset[]> {
    return this.makeRequestAndWaitForResponse(`datasets:export-for-project`, { projectId });
  }
}
