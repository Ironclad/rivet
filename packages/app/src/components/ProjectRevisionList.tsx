import { useState, type FC } from 'react';
import { loadedProjectState } from '../state/savedGraphs';
import { useRecoilValue } from 'recoil';
import { revisionStyles } from './GraphRevisionList';
import Button from '@atlaskit/button';
import { useProjectRevisions } from '../hooks/useGraphRevisions';
import { type CalculatedRevision } from '../utils/ProjectRevisionCalculator';

export const ProjectRevisions: FC = () => {
  const projectState = useRecoilValue(loadedProjectState);

  const [enabled, setEnabled] = useState(false);

  if (!projectState.loaded || !projectState.path) {
    return <div>No git history</div>;
  }

  if (!enabled) {
    return (
      <div css={revisionStyles}>
        <Button onClick={() => setEnabled(true)}>Show Revisions</Button>
      </div>
    );
  }

  return (
    <div css={revisionStyles}>
      <ProjectRevisionList />
    </div>
  );
};

const ProjectRevisionList: FC = () => {
  const { revisions, isLoading, stop, resume, numTotalRevisions, numProcessedRevisions } = useProjectRevisions();

  return (
    <div css={revisionStyles}>
      <div className="revisions">
        {revisions.map((revision) => (
          <ProjectRevisionListEntry key={revision.hash} revision={revision} />
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

export const ProjectRevisionListEntry: FC<{
  revision: CalculatedRevision;
}> = ({ revision }) => {
  return (
    <div className="revision">
      <div className="hash">
        <span>{revision.hash.slice(0, 6)}</span>
      </div>
      <div className="message">{revision.message}</div>
    </div>
  );
};
