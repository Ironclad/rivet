import { useState, type FC } from 'react';
import { loadedProjectState, projectState } from '../state/savedGraphs';
import { useAtomValue } from 'jotai';
import { revisionStyles } from './GraphRevisionList';
import Button from '@atlaskit/button';
import { useHasGitHistory, useProjectRevisions } from '../hooks/useGraphRevisions';
import { type CalculatedRevision } from '../utils/ProjectRevisionCalculator';
import Modal, { ModalTransition, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@atlaskit/modal-dialog';
import { css } from '@emotion/react';
import { type GraphId } from '@ironclad/rivet-core';
import { useChooseHistoricalGraph } from '../hooks/useChooseHistoricalGraph';

export const ProjectRevisions: FC = () => {
  const projectState = useAtomValue(loadedProjectState);

  const [enabled, setEnabled] = useState(false);

  const hasRevisions = useHasGitHistory();

  if (!projectState.loaded || !projectState.path || !hasRevisions) {
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

  const [selectedRevision, setSelectedRevision] = useState<CalculatedRevision | undefined>();

  return (
    <div css={revisionStyles}>
      <div className="revisions">
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
        {revisions.map((revision) => (
          <ProjectRevisionListEntry
            key={revision.hash}
            revision={revision}
            onSelected={(rev) => setSelectedRevision(rev)}
          />
        ))}
      </div>
      <ProjectRevisionChangesModal revision={selectedRevision} onClose={() => setSelectedRevision(undefined)} />
    </div>
  );
};

export const ProjectRevisionListEntry: FC<{
  revision: CalculatedRevision;
  onSelected?: (revision: CalculatedRevision) => void;
}> = ({ revision, onSelected }) => {
  return (
    <div className="revision" onClick={() => onSelected?.(revision)}>
      <div className="hash">
        <span>{revision.hash.slice(0, 6)}</span>
      </div>
      <div className="message">{revision.message}</div>
    </div>
  );
};

const modalBodyStyles = css`
  .author {
    span {
      background: var(--grey-darkest);
      padding: 4px 8px;
      border-radius: 8px;
    }
  }

  .date {
    font-size: 12px;
    margin-left: 16px;
    margin-top: 4px;
  }

  .description {
    padding-left: 16px;
    border-left: 4px solid var(--grey-darkest);
  }
`;

const ProjectRevisionChangesModal: FC<{
  revision: CalculatedRevision | undefined;
  onClose: () => void;
}> = ({ revision, onClose }) => {
  return (
    <ModalTransition>
      {revision && (
        <Modal onClose={() => onClose()}>
          <ModalHeader>
            <ModalTitle>Revision {revision.hash}</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <div css={modalBodyStyles}>
              <div className="author">
                <span>
                  {revision.authorName} &lt;{revision.authorEmail}&gt;
                </span>
              </div>
              <div className="date">{revision.date.toString()}</div>
              <p className="description">{revision.message}</p>
              <h3>Changed Graphs</h3>
              <div className="changes">
                {revision.changedGraphs.map((graphId) => (
                  <ChangedGraph key={graphId} graphId={graphId} revision={revision} onGraphChosen={() => onClose()} />
                ))}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button appearance="primary" onClick={() => onClose()}>
              Close
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </ModalTransition>
  );
};

const ChangedGraph: FC<{
  graphId: GraphId;
  revision: CalculatedRevision;
  onGraphChosen: (graphId: GraphId) => void;
}> = ({ graphId, revision, onGraphChosen }) => {
  const graph = revision.projectAtRevision?.graphs[graphId];
  const chooseGraph = useChooseHistoricalGraph(revision);

  const onClick = () => {
    chooseGraph(graphId);
    onGraphChosen?.(graphId);
  };

  if (graph != null) {
    return (
      <div>
        <Button onClick={onClick} appearance="link">
          {graph.metadata?.name ?? 'Unknown Graph'}
        </Button>
      </div>
    );
  } else {
    return <div>Graph {graphId} (not currently present)</div>;
  }
};
