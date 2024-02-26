import { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import {
  loadedProjectState,
  type OpenedProjectInfo,
  openedProjectsSortedIdsState,
  openedProjectsState,
  projectState,
} from '../state/savedGraphs';

export function useSyncCurrentStateIntoOpenedProjects() {
  const [openedProjects, setOpenedProjects] = useRecoilState(openedProjectsState);
  const [openedProjectsSortedIds, setOpenedProjectsSortedIds] = useRecoilState(openedProjectsSortedIdsState);

  const currentProject = useRecoilValue(projectState);
  const loadedProject = useRecoilValue(loadedProjectState);
  const currentGraph = useRecoilValue(graphState);

  // Make sure current opened project is in opened projects
  useEffect(() => {
    if (currentProject && openedProjects[currentProject.metadata.id] == null) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          project: currentProject,
          fsPath: null,
        } satisfies OpenedProjectInfo,
      }));
    }

    if (loadedProject.path && !openedProjects[currentProject.metadata.id]?.fsPath) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [currentProject.metadata.id]: {
          project: currentProject,
          fsPath: loadedProject.path,
        } satisfies OpenedProjectInfo,
      }));
    }

    if (currentProject && openedProjectsSortedIds.includes(currentProject.metadata.id) === false) {
      setOpenedProjectsSortedIds((ids) => [...ids, currentProject.metadata.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentProject, loadedProject, setOpenedProjects]);

  // Sync current project into opened projects
  useEffect(() => {
    setOpenedProjects((openedProjects) => ({
      ...openedProjects,
      [currentProject.metadata.id]: {
        ...openedProjects[currentProject.metadata.id],
        project: currentProject,
      } satisfies OpenedProjectInfo,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentProject]);

  // Track project and graph state, so that when the user switches projects, we can track that state without saving the project.
  const [prevProjectState, setPrevProjectState] = useState({
    project: currentProject,
    openedGraph: currentGraph?.metadata?.id,
  } satisfies OpenedProjectInfo);
  useEffect(() => {
    if (
      currentGraph.metadata?.id != null &&
      currentProject.graphs[currentGraph.metadata.id] &&
      prevProjectState.project.metadata.id === currentProject.metadata.id
    ) {
      setPrevProjectState({
        project: {
          ...currentProject,
          graphs: {
            ...currentProject.graphs,
            [currentGraph.metadata!.id!]: currentGraph,
          },
        },
        openedGraph: currentGraph.metadata!.id!,
      } satisfies OpenedProjectInfo);
    }
  }, [currentGraph, currentProject, prevProjectState.project.metadata.id]);

  // Sync current graph into opened projects when user switches projects.
  useEffect(() => {
    if (
      prevProjectState.project != null &&
      prevProjectState.project.metadata.id !== currentProject.metadata.id &&
      openedProjects[prevProjectState.project.metadata.id]
    ) {
      setOpenedProjects((openedProjects) => ({
        ...openedProjects,
        [prevProjectState.project.metadata.id]: {
          ...openedProjects[prevProjectState.project.metadata.id],
          project: prevProjectState.project,
          openedGraph: prevProjectState.openedGraph,
        } satisfies OpenedProjectInfo,
      }));
      // Update prevProjectState, so that we track changes to it
      setPrevProjectState({
        project: currentProject,
        openedGraph: currentGraph?.metadata?.id,
      } satisfies OpenedProjectInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [currentProject]);
}
