import { css } from '@emotion/react';
import { type FC } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { graphState, historicalGraphState, isReadOnlyGraphState } from '../state/graph';
import Button from '@atlaskit/button';
import { useLoadGraph } from '../hooks/useLoadGraph';
import { projectState } from '../state/savedGraphs';

const styles = css`
  position: fixed;
  top: calc(var(--project-selector-height) + 80px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--grey-darkish);
  border-radius: 8px;
  border: 1px solid var(--grey-dark);
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 3px 1px 10px rgba(0, 0, 0, 0.5);
  user-select: none;
  padding: 16px;

  code {
    background: var(--grey-light);
    padding: 2px 4px;
    border-radius: 4px;
    color: var(--grey-darker);
  }
`;

export const HistoricalGraphNotice: FC = () => {
  const loadGraph = useLoadGraph();

  const project = useAtomValue(projectState);
  const graph = useAtomValue(graphState);
  const [historicalGraph, setHistoricalGraph] = useAtom(historicalGraphState);
  const [isReadOnlyGraph, setIsReadOnlyGraph] = useAtom(isReadOnlyGraphState);

  const currentGraphExists = graph.metadata!.id! in project.graphs;

  function backToCurrent() {
    if (currentGraphExists) {
      setHistoricalGraph(null);
      setIsReadOnlyGraph(false);
      loadGraph(project.graphs[graph.metadata!.id!]!);
    }
  }

  if (!isReadOnlyGraph) {
    return null;
  }

  return (
    <div css={styles}>
      <span>
        {historicalGraph == null ? (
          'Read-only graph'
        ) : (
          <>
            Viewing graph at commit <code>{historicalGraph.hash.slice(0, 6)}</code>
          </>
        )}
      </span>
      <Button onClick={backToCurrent}>Back to Current</Button>
    </div>
  );
};
