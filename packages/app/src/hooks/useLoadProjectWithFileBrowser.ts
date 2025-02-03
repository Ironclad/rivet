import { useAtom, useSetAtom } from 'jotai';
import { loadedProjectState, projectState, projectsState } from '../state/savedGraphs.js';
import { type NodeGraph, emptyNodeGraph, getError } from '@ironclad/rivet-core';
import { graphState } from '../state/graph.js';
import { ioProvider } from '../utils/globals.js';
import { trivetState } from '../state/trivet.js';
import { useSetStaticData } from './useSetStaticData';
import { toast } from 'react-toastify';
import { graphNavigationStackState } from '../state/graphBuilder';
import { useCenterViewOnGraph } from './useCenterViewOnGraph';

export function useLoadProjectWithFileBrowser() {
  const setProject = useSetAtom(projectState);
  const setLoadedProjectState = useSetAtom(loadedProjectState);
  const [projects, setProjects] = useAtom(projectsState);
  const setGraph = useSetAtom(graphState);
  const setTrivetState = useSetAtom(trivetState);
  const setStaticData = useSetStaticData();
  const setNavigationStack = useSetAtom(graphNavigationStackState);
  const centerViewOnGraph = useCenterViewOnGraph();

  return async () => {
    try {
      await ioProvider.loadProjectData(({ project, testData, path }) => {
        const { data, ...projectData } = project;

        if (Object.values(projects.openedProjects).some((p) => p.fsPath === path)) {
          toast.error(`That project is already open.`);
          return;
        }

        const alreadyOpenedProject = Object.values(projects.openedProjects).find(
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

        let graphToLoad: NodeGraph;
        if (projectData.metadata.mainGraphId && projectData.graphs[projectData.metadata.mainGraphId]) {
          graphToLoad = projectData.graphs[projectData.metadata.mainGraphId]!;
        } else {
          graphToLoad =
            Object.values(projectData.graphs).sort((a, b) =>
              (a.metadata?.name ?? '').localeCompare(b.metadata?.name ?? ''),
            )[0] ?? emptyNodeGraph();
        }

        setGraph(graphToLoad);
        centerViewOnGraph(graphToLoad);

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

        setProjects((prev) => ({
          openedProjects: {
            ...prev.openedProjects,
            [project.metadata.id]: {
              project: projectData,
              fsPath: path,
            },
          },
          openedProjectsSortedIds: [...prev.openedProjectsSortedIds, project.metadata.id],
        }));
      });
    } catch (err) {
      toast.error(`Failed to load project: ${getError(err).message}`);
    }
  };
}
