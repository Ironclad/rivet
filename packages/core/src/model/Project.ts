import { Opaque } from 'type-fest';
import { GraphId, NodeGraph, SerializedGraph } from './NodeGraph.js';

export type ProjectId = Opaque<string, 'ProjectId'>;

export type Project = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
  };

  graphs: Record<GraphId, NodeGraph>;
};

export type SerializedProject = {
  metadata: {
    id: ProjectId;
    title: string;
    description: string;
  };

  graphs: Record<GraphId, SerializedGraph>;
};
