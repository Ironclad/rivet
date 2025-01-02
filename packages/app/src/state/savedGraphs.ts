import { atom } from 'jotai';
import { atomWithStorage, atomFamily } from 'jotai/utils';
import { nanoid } from 'nanoid/non-secure';
import { produce } from 'immer';
import {
  type NodeId,
  type DataId,
  type GraphId,
  type NodeGraph,
  type Project,
  type ProjectId,
  type ChartNode,
  type DataValue,
} from '@ironclad/rivet-core';
import { blankProject } from '../utils/blankProject.js';
import { entries, values } from '../../../core/src/utils/typeSafety';
import { createStorage } from './storage.js';
/** Project context values stored in the IDE and not in the project file. Available in Context nodes. */
export type ProjectContext = Record<
  string,
  {
    value: DataValue;
    secret: boolean;
  }
>;

const storage = createStorage('project');

// What's the data of the last loaded project?
export const projectState = atomWithStorage<Omit<Project, 'data'>>(
  'projectState',
  {
    metadata: {
      id: nanoid() as ProjectId,
      description: '',
      title: 'Untitled Project',
    },
    graphs: {},
    plugins: [],
  },
  storage,
);

export const projectDataState = atom<Record<DataId, string> | undefined>(undefined);

export const projectMetadataState = atom(
  (get) => get(projectState).metadata,
  (get, set, newValue: Project['metadata'] | undefined) => {
    set(projectState, {
      ...get(projectState),
      metadata: newValue ?? blankProject().metadata,
    });
  },
);

export const projectGraphInfoState = atom((get) => {
  const project = get(projectState);
  return {
    graphs: Object.fromEntries(
      entries(project.graphs).map(([id, graph]) => [
        id,
        {
          id,
          name: graph.metadata!.name,
          description: graph.metadata!.description,
        },
      ]),
    ),
    metadata: project.metadata,
  };
});

// Which project file was loaded last and where is it?
export const loadedProjectState = atomWithStorage(
  'loadedProjectState',
  {
    path: '',
    loaded: false,
  },
  storage,
);

export const savedGraphsState = atom(
  (get) => values(get(projectState).graphs ?? {}),
  (get, set, newValue: NodeGraph[]) => {
    const project = get(projectState);
    const newProject = produce(project, (draft) => {
      draft.graphs = {};
      for (const graph of newValue) {
        if (graph.metadata == null) {
          graph.metadata = {
            id: nanoid() as GraphId,
            name: 'Untitled Graph',
            description: '',
          };
        } else if (graph.metadata.id == null) {
          graph.metadata.id = nanoid() as GraphId;
        }

        draft.graphs[graph.metadata!.id!] = graph;
      }
    });

    set(projectState, newProject);
  },
);

export const projectPluginsState = atom(
  (get) => get(projectState).plugins ?? [],
  (get, set, newValue: Project['plugins'] | undefined) => {
    set(projectState, {
      ...get(projectState),
      plugins: newValue ?? blankProject().plugins,
    });
  },
);

export type OpenedProjectInfo = {
  project: Project;
  fsPath?: string | null;
  openedGraph?: GraphId;
};

export type OpenedProjectsInfo = {
  openedProjects: Record<ProjectId, OpenedProjectInfo>;
  openedProjectsSortedIds: ProjectId[];
};

export const projectsState = atomWithStorage<OpenedProjectsInfo>(
  'projectsState',
  {
    openedProjects: {},
    openedProjectsSortedIds: [],
  },
  storage,
);

export const openedProjectsState = atom(
  (get) => get(projectsState).openedProjects,
  (get, set, newValue: Record<ProjectId, OpenedProjectInfo> | undefined) => {
    set(projectsState, {
      ...get(projectsState),
      openedProjects: newValue ?? {},
    });
  },
);

export const openedProjectsSortedIdsState = atom(
  (get) => get(projectsState).openedProjectsSortedIds,
  (get, set, newValue: ProjectId[] | undefined) => {
    set(projectsState, {
      ...get(projectsState),
      openedProjectsSortedIds: newValue ?? [],
    });
  },
);

export const projectContextState = atomFamily((projectId: ProjectId) =>
  atomWithStorage<ProjectContext>(`projectContext-${projectId}`, {}, storage),
);
