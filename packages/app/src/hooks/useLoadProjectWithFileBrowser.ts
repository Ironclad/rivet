import { useSetRecoilState } from 'recoil';
import { loadedProjectState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph, getError } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';
import { useSetStaticData } from './useSetStaticData';
import { toast } from 'react-toastify';
import { graphNavigationStackState } from '../state/graphBuilder';

export function useLoadProjectWithFileBrowser() {
  const setProject = useSetRecoilState(projectState);
  const setLoadedProjectState = useSetRecoilState(loadedProjectState);
  const setGraphData = useSetRecoilState(graphState);
  const setTrivetState = useSetRecoilState(trivetState);
  const setStaticData = useSetStaticData();
  const setNavigationStack = useSetRecoilState(graphNavigationStackState);

  return async () => {
    try {
      await ioProvider.loadProjectData(({ project, testData, path }) => {
        const { data, ...projectData } = project;

        setProject(projectData);
        setNavigationStack({ stack: [], index: undefined });

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
    } catch (err) {
      toast.error(`Failed to load project: ${getError(err).message}`);
    }
  };
}
