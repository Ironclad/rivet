import { useState, type FC } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { loadedProjectState } from '../state/savedGraphs';
import { useGraphRevisions } from '../hooks/useGraphRevisions';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { type CalculatedRevision } from '../utils/ProjectRevisionCalculator';
import { graphState, historicalGraphState, isReadOnlyGraphState } from '../state/graph';
import { GraphId } from '@ironclad/rivet-core';

const styles = css`
  .revisions {
    max-height: 800px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    margin-right: -12px;
    margin-left: -12px;
  }

  .revision {
    border-bottom: 1px solid var(--grey);
    padding: 8px;
    padding-left: 12px;

    cursor: pointer;

    &:hover {
      background-color: var(--grey-darkish);
    }
  }

  .hash {
    border-radius: 8px;
    background-color: black;
    display: inline-flex;
    padding: 2px 4px;
    font-size: 11px;
  }

  .message {
    font-size: 12px;
  }

  .loading-area {
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .loaded-area {
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
`;

export const GraphRevisions: FC = () => {
  const projectState = useRecoilValue(loadedProjectState);
  const [enabled, setEnabled] = useState(false);

  if (!projectState.loaded || !projectState.path) {
    return <div>No git history</div>;
  }

  if (!enabled) {
    return (
      <div css={styles}>
        <Button onClick={() => setEnabled(true)}>Show Revisions</Button>
      </div>
    );
  }

  return (
    <div css={styles}>
      <GraphRevisionList />
    </div>
  );
};

export const GraphRevisionList: FC = () => {
  const { revisions, isLoading, stop, resume, numTotalRevisions, numProcessedRevisions } = useGraphRevisions();

  return (
    <div css={styles}>
      <div className="revisions">
        {revisions.map((revision) => (
          <GraphRevisionListEntry key={revision.hash} revision={revision} />
        ))}
        {isLoading ? (
          <div className="loading-area">
            <div>
              Loading... ({numProcessedRevisions} / {numTotalRevisions})
            </div>
            <Button onClick={() => stop()}>Stop Loading</Button>
          </div>
        ) : (
          <div className="loaded-area">
            <span>Searched {numProcessedRevisions} revisions for changes to graph.</span>
            {(numProcessedRevisions < numTotalRevisions || numTotalRevisions === 0) && (
              <Button onClick={() => resume()}>Load More</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const GraphRevisionListEntry: FC<{
  revision: CalculatedRevision;
}> = ({ revision }) => {
  const currentGraphId = useRecoilValue(graphState).metadata!.id!;
  const setGraph = useSetRecoilState(graphState);
  const setIsReadOnlyGraph = useSetRecoilState(isReadOnlyGraphState);
  const setHistoricalGraph = useSetRecoilState(historicalGraphState);

  function chooseGraph() {
    setGraph(revision.projectAtRevision!.graphs[currentGraphId]!);
    setIsReadOnlyGraph(true);
    setHistoricalGraph(revision);
  }

  return (
    <div className="revision" onClick={chooseGraph}>
      <div className="hash">
        <span>{revision.hash.slice(0, 6)}</span>
      </div>
      <div className="message">{revision.message}</div>
    </div>
  );
};
