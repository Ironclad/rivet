import { useSetRecoilState } from 'recoil';
import { ioProvider } from '../utils/globals';
import { graphState } from '../state/graph';

export function useImportGraph() {
  const setGraphData = useSetRecoilState(graphState);

  return () => {
    ioProvider.loadGraphData((data) => setGraphData(data));
  };
}
