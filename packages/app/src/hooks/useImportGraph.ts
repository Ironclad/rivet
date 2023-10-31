import { useSetRecoilState } from 'recoil';
import { ioProvider } from '../utils/globals';
import { graphState } from '../state/graph';
import { duplicateGraph } from '../utils/duplicateGraph';

export function useImportGraph() {
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    ioProvider.loadGraphData((data) => {
      // Duplicate so that we get a fresh set of IDs for the imported graph
      const duplicated = duplicateGraph(data);
      return setGraphData(duplicated);
    });
  };
}
