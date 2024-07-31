import { useSetRecoilState } from 'recoil';
import {
  loadedProjectState,
  openedProjectsSortedIdsState,
  openedProjectsState,
  projectState,
} from '../state/savedGraphs.js';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { trivetState } from '../state/trivet';
import { blankProject } from '../utils/blankProject';

export function useNewProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProject = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetData = useSetRecoilState(trivetState);

  const setOpenedProjectsSortedIds = useSetRecoilState(openedProjectsSortedIdsState);
  const setOpenedProjects = useSetRecoilState(openedProjectsState);

  return ({
    title,
    description,
  }: {
    title?: string;
    description?: string;
  } = {}) => {
    const { data: _data, ...project } = blankProject();

    project.metadata.title = title || project.metadata.title;
    project.metadata.description = description || project.metadata.description;

    setProject(project);
    setLoadedProject({ loaded: false, path: '' });

    setOpenedProjects((projects) => ({
      ...projects,
      [project.metadata.id]: {
        project,
        fsPath: null,
      },
    }));
    setOpenedProjectsSortedIds((ids) => [...ids, project.metadata.id]);

    setGraphData(emptyNodeGraph());
    setTrivetData({
      runningTests: false,
      testSuites: [],
    });
  };
}
