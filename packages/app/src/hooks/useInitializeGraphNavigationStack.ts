import { useAtom, useAtomValue } from 'jotai';
import { savedGraphsState } from '../state/savedGraphs';
import { graphState } from '../state/graph';
import { graphNavigationStackState } from '../state/graphBuilder';
import { useEffect } from 'react';

export function useInitializeGraphNavigationStack() {
  const savedGraphs = useAtomValue(savedGraphsState);
  const graph = useAtomValue(graphState);
  const [graphNavigationStack, setGraphNavigationStack] = useAtom(graphNavigationStackState);

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
