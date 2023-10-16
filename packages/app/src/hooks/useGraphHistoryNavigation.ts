import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { graphNavigationStackState } from '../state/graphBuilder.js';
import { projectState } from '../state/savedGraphs.js';
import { useLoadGraph } from '../hooks/useLoadGraph.js';

export const useGraphHistoryNavigation = () => {
  const [graphNavigationStack, setGraphNavigationStack] = useRecoilState(graphNavigationStackState);
  const loadGraph = useLoadGraph();
  const project = useRecoilValue(projectState);

  const hasForward =
    graphNavigationStack.index != null && graphNavigationStack.index < graphNavigationStack.stack.length - 1;
  const hasBackward = (graphNavigationStack.index ?? -1) > 0;

  const navigateBack = useCallback(() => {
    if ((graphNavigationStack.index ?? -1) > 0) {
      const prevGraphId = graphNavigationStack.stack[graphNavigationStack.index! - 1]!;
      setGraphNavigationStack((stack) => ({
        ...stack,
        index: stack.index! - 1,
      }));

      const graph = project.graphs[prevGraphId];

      if (graph) {
        loadGraph(graph, { pushHistory: false });
      }
    }
  }, [graphNavigationStack, loadGraph, project, setGraphNavigationStack]);

  const navigateForward = useCallback(() => {
    if (graphNavigationStack.index != null && graphNavigationStack.index < graphNavigationStack.stack.length - 1) {
      const nextGraphId = graphNavigationStack.stack[graphNavigationStack.index! + 1]!;
      setGraphNavigationStack((stack) => ({
        ...stack,
        index: stack.index! + 1,
      }));

      const graph = project.graphs[nextGraphId];

      if (graph) {
        loadGraph(graph, { pushHistory: false });
      }
    }
  }, [graphNavigationStack, loadGraph, project, setGraphNavigationStack]);

  return { navigateBack, navigateForward, hasForward, hasBackward };
};
