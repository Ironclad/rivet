import { type OpenedProjectInfo, loadedProjectState, projectState } from '../state/savedGraphs.js';
import { emptyNodeGraph, getError } from '@ironclad/rivet-core';
import { graphState, historicalGraphState, isReadOnlyGraphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';
import { useSetStaticData } from './useSetStaticData';
import { toast } from 'react-toastify';
import { graphNavigationStackState } from '../state/graphBuilder';
import { useSetAtom } from 'jotai';

export function useLoadProject() {
  const setProject = useSetAtom(projectState);
  const setLoadedProjectState = useSetAtom(loadedProjectState);
  const setGraphData = useSetAtom(graphState);
  const setTrivetState = useSetAtom(trivetState);
  const setStaticData = useSetStaticData();
  const setNavigationStack = useSetAtom(graphNavigationStackState);
  const setIsReadOnlyGraph = useSetAtom(isReadOnlyGraphState);
  const setHistoricalGraph = useSetAtom(historicalGraphState);

  return async (projectInfo: OpenedProjectInfo) => {
    try {
      setProject(projectInfo.project);

      setNavigationStack({ stack: [], index: undefined });

      setIsReadOnlyGraph(false);
      setHistoricalGraph(null);

      if (projectInfo.openedGraph) {
        const graphData = projectInfo.project.graphs[projectInfo.openedGraph];
        if (graphData) {
          setGraphData(graphData);
        } else {
          setGraphData(emptyNodeGraph());
        }
      } else {
        setGraphData(emptyNodeGraph());
      }

      if (projectInfo.project.data) {
        setStaticData(projectInfo.project.data);
      }

      setLoadedProjectState({
        path: projectInfo.fsPath ?? '',
        loaded: true,
      });

      if (projectInfo.fsPath) {
        const { testData } = await ioProvider.loadProjectDataNoPrompt(projectInfo.fsPath);

        setTrivetState({
          testSuites: testData.testSuites,
          selectedTestSuiteId: undefined,
          editingTestCaseId: undefined,
          recentTestResults: undefined,
          runningTests: false,
        });
      } else {
        setTrivetState({
          testSuites: [],
          selectedTestSuiteId: undefined,
          editingTestCaseId: undefined,
          recentTestResults: undefined,
          runningTests: false,
        });
      }
    } catch (err) {
      toast.error(`Failed to load project: ${getError(err).message}`);
    }
  };
}
