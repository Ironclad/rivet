import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { trivetState } from '../state/trivet';
import { blankProject } from '../utils/blankProject';

export function useNewProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProject = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetData = useSetRecoilState(trivetState);

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
    setGraphData(emptyNodeGraph());
    setTrivetData({
      runningTests: false,
      testSuites: [],
    });
  };
}
