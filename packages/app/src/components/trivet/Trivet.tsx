import { useRecoilState } from 'recoil';
import { trivetState } from '../../state/trivet';
import { type FC, useCallback, useMemo } from 'react';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { TestSuiteList } from './TestSuiteList';
import { TestSuiteRenderer } from './TestSuite';
import { nanoid } from 'nanoid/non-secure';
import { type TryRunTests } from './api';
import { overlayOpenState } from '../../state/ui';
import { NoTestSuitesSplash } from './NoTestSuitesSplash';

const styles = css`
  position: fixed;
  top: var(--project-selector-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 150;

  .close-trivet {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    cursor: pointer;
  }

  .trivet-content {
    display: flex;
    flex-direction: row;
    height: 100%;
  }

  .test-suite-column {
    width: 250px;
  }

  .test-case-column {
    flex: 1;
  }
`;

export const TrivetRenderer: FC<{ tryRunTests: TryRunTests }> = ({ tryRunTests }) => {
  const [openOverlay, setOpenOverlay] = useRecoilState(overlayOpenState);

  if (openOverlay !== 'trivet') return null;

  return <TrivetContainer tryRunTests={tryRunTests} onClose={() => setOpenOverlay(undefined)} />;
};

export type TrivetContainerProps = {
  onClose: () => void;
  tryRunTests: TryRunTests;
};

export const TrivetContainer: FC<TrivetContainerProps> = ({ tryRunTests, onClose }) => {
  const [{ testSuites, selectedTestSuiteId, runningTests, recentTestResults }, setState] = useRecoilState(trivetState);
  const selectedTestSuite = useMemo(
    () => testSuites.find((ts) => ts.id === selectedTestSuiteId),
    [testSuites, selectedTestSuiteId],
  );
  const createNewTestSuite = useCallback(() => {
    setState((s) => {
      const newSuiteId = nanoid();
      return {
        ...s,
        testSuites: [...s.testSuites, { id: newSuiteId, testCases: [], testGraph: 'a', validationGraph: 'a' }],
        selectedTestSuiteId: newSuiteId,
      };
    });
  }, [setState]);
  const deleteTestSuite = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        testSuites: s.testSuites.filter((ts) => ts.id !== id),
      }));
    },
    [setState],
  );
  const runningTestSuiteId = useMemo(() => {
    if (!runningTests || recentTestResults == null || recentTestResults.testSuiteResults.length === 0) {
      return undefined;
    }
    return recentTestResults.testSuiteResults[recentTestResults.testSuiteResults.length - 1]?.id;
  }, [runningTests, recentTestResults]);
  const runTestSuite = useCallback(
    (id: string) => {
      tryRunTests({
        testSuiteIds: [id],
      });
    },
    [tryRunTests],
  );

  return (
    <div css={styles}>
      <Button className="close-trivet" appearance="subtle" onClick={onClose}>
        &times;
      </Button>

      <div className="trivet-content">
        <div className="test-suite-column">
          <TestSuiteList
            testSuites={testSuites}
            selectedTestSuite={selectedTestSuite}
            setSelectedTestSuite={(id) => setState((s) => ({ ...s, selectedTestSuiteId: id }))}
            createNewTestSuite={createNewTestSuite}
            deleteTestSuite={deleteTestSuite}
            runningTestSuiteId={runningTestSuiteId}
            runTestSuite={runTestSuite}
          />
        </div>
        <div className="test-case-column">
          {testSuites.length === 0 ? (
            <NoTestSuitesSplash onCreateTestSuite={createNewTestSuite} />
          ) : (
            <TestSuiteRenderer tryRunTests={tryRunTests} />
          )}
        </div>
      </div>
    </div>
  );
};
