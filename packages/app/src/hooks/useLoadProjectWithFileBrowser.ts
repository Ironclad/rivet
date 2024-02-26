import { useRecoilValue, useSetRecoilState } from 'recoil';
import { loadedProjectState, openedProjectsState, projectState } from '../state/savedGraphs.js';
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
  const openedProjects = useRecoilValue(openedProjectsState);

  return async () => {
    try {
      await ioProvider.loadProjectData(({ project, testData, path }) => {
        const { data, ...projectData } = project;

        if (Object.values(openedProjects).some((p) => p.fsPath === path)) {
          toast.error(`That project is already open.`);
          return;
        }

        const alreadyOpenedProject = Object.values(openedProjects).find(
          (p) => p.project.metadata.id === project.metadata.id,
        );

        if (alreadyOpenedProject) {
          toast.error(
            `"${alreadyOpenedProject.project.metadata.title} [${
              alreadyOpenedProject.fsPath?.split('/').pop() ?? 'no path'
            }]" shares the same ID (${
              project.metadata.id
            }) and is already open. Please close that project first to open this one.`,
          );
          return;
        }

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
