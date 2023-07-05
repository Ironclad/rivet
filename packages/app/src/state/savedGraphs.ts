import { DefaultValue, atom, selector } from 'recoil';
import { nanoid } from 'nanoid';
import { values } from '../utils/typeSafety';
import { produce } from 'immer';
import { GraphId, NodeGraph, Project, ProjectId } from '@ironclad/rivet-core';
import { blankProject } from '../hooks/useNewProject';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist({ key: 'project' });

// What's the data of the last loaded project?
export const projectState = atom<Project>({
  key: 'projectState',
  default: {
    metadata: {
      id: nanoid() as ProjectId,
      description: '',
      title: 'Untitled Project',
    },
    graphs: {},
  },
  effects_UNSTABLE: [persistAtom],
});

export const projectMetadataState = selector({
  key: 'projectMetadataState',
  get: ({ get }) => {
    return get(projectState).metadata;
  },
  set: ({ set }, newValue) => {
    set(projectState, (oldValue) => {
      return {
        ...oldValue,
        metadata: newValue instanceof DefaultValue ? blankProject().metadata : newValue,
      };
    });
  },
});

// Which project file was loaded last and where is it?
export const loadedProjectState = atom<{
  path: string;
  loaded: boolean;
}>({
  key: 'loadedProjectState',
  default: {
    path: '',
    loaded: false,
  },
  effects_UNSTABLE: [persistAtom],
});

export const savedGraphsState = selector<NodeGraph[]>({
  key: 'savedGraphsState',
  get: ({ get }) => {
    const project = get(projectState);
    return values(project.graphs);
  },
  set: ({ set, get }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }

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
});
