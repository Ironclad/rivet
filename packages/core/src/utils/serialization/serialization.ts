// @ts-ignore
import * as yaml from 'yaml';
import { graphV3Deserializer, projectV3Deserializer } from './serialization_v3.js';
import type { Project, NodeGraph, ProjectId, DatasetProvider, Dataset, DatasetMetadata } from '../../index.js';
import { getError } from '../errors.js';
import { type AttachedData, yamlProblem } from './serializationUtils.js';
import {
  datasetV4Deserializer,
  datasetV4Serializer,
  graphV4Deserializer,
  graphV4Serializer,
  projectV4Deserializer,
  projectV4Serializer,
} from './serialization_v4.js';
import { graphV2Deserializer, projectV2Deserializer } from './serialization_v2.js';
import { graphV1Deserializer, projectV1Deserializer } from './serialization_v1.js';

export function serializeProject(project: Project, attachedData?: AttachedData): unknown {
  return projectV4Serializer(project, attachedData);
}

export function deserializeProject(serializedProject: unknown): [Project, AttachedData] {
  try {
    return projectV4Deserializer(serializedProject);
  } catch (err) {
    if (err instanceof yaml.YAMLError) {
      yamlProblem(err);
    }
    console.warn(`Failed to deserialize project v4: ${getError(err).stack}`);

    try {
      const project = projectV3Deserializer(serializedProject);
      return [project, {}];
    } catch (err) {
      if (err instanceof yaml.YAMLError) {
        yamlProblem(err);
      }
      console.warn(`Failed to deserialize project v3: ${getError(err).stack}`);

      try {
        const project = projectV2Deserializer(serializedProject);
        return [project, {}];
      } catch (err) {
        if (err instanceof yaml.YAMLError) {
          yamlProblem(err);
        }
        console.warn(`Failed to deserialize project v2: ${getError(err).stack}`);

        try {
          const project = projectV1Deserializer(serializedProject);
          return [project, {}];
        } catch (err) {
          console.warn(`Failed to deserialize project v1: ${getError(err).stack}`);
          throw new Error('Could not deserialize project');
        }
      }
    }
  }
}

export function serializeGraph(graph: NodeGraph): unknown {
  return graphV4Serializer(graph);
}

export function deserializeGraph(serializedGraph: unknown): NodeGraph {
  try {
    return graphV4Deserializer(serializedGraph);
  } catch (err) {
    try {
      return graphV3Deserializer(serializedGraph);
    } catch (err) {
      try {
        return graphV2Deserializer(serializedGraph);
      } catch (err) {
        try {
          return graphV1Deserializer(serializedGraph);
        } catch (err) {
          throw new Error('Could not deserialize graph');
        }
      }
    }
  }
}

export type CombinedDataset = {
  meta: DatasetMetadata;
  data: Dataset;
};

export function serializeDatasets(datasets: CombinedDataset[]): string {
  return datasetV4Serializer(datasets);
}

export function deserializeDatasets(serializedDatasets: string): CombinedDataset[] {
  return datasetV4Deserializer(serializedDatasets);
}
