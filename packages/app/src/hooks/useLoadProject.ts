import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';

export function useLoadProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProjectState = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetState = useSetRecoilState(trivetState);

  return () => {
    ioProvider.loadProjectData(({ project, testData, path }) => {
      setProject(project);

      setGraphData(emptyNodeGraph());

      setLoadedProjectState({
        path,
        loaded: true,
      });

      setTrivetState({
        testSuites: testData.testSuites,
        selectedTestSuiteId: undefined,
        editingTestCaseId: undefined,
        recentTestResults: undefined,
        runningTests: false,
      });
    });
  };
}
