import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectDataState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';
import { useStaticDataDatabase } from './useStaticDataDatabase';
import { entries } from '../../../core/src/utils/typeSafety';
import { useSetStaticData } from './useSetStaticData';

export function useLoadProject() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProjectState = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetState = useSetRecoilState(trivetState);
  const setStaticData = useSetStaticData();

  return () => {
    ioProvider.loadProjectData(({ project, testData, path }) => {
      const { data, ...projectData } = project;

      setProject(projectData);

      if (data) {
        setStaticData(data);
      }

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
