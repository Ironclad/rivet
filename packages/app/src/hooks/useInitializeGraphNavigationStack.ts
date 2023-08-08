import { useRecoilState, useRecoilValue } from 'recoil';
import { savedGraphsState } from '../state/savedGraphs';
import { graphState } from '../state/graph';
import { graphNavigationStackState } from '../state/graphBuilder';
import { useEffect } from 'react';

export function useInitializeGraphNavigationStack() {
  const savedGraphs = useRecoilValue(savedGraphsState);
  const graph = useRecoilValue(graphState);
  const [graphNavigationStack, setGraphNavigationStack] = useRecoilState(graphNavigationStackState);

  useEffect(() => {
    if (
      graphNavigationStack.stack.length === 0 &&
      graph.metadata?.id != null &&
      savedGraphs.find((g) => g.metadata!.id! === graph.metadata!.id)
    ) {
      setGraphNavigationStack({ index: 0, stack: [graph.metadata!.id] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
