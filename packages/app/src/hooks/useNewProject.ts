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

  return () => {
    const { data: _data, ...project } = blankProject();

    setProject(project);
    setLoadedProject({ loaded: false, path: '' });
    setGraphData(emptyNodeGraph());
    setTrivetData({
      runningTests: false,
      testSuites: [],
    });
  };
}
