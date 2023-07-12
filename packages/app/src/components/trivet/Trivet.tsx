import { useRecoilState } from 'recoil';
import { trivetState } from '../../state/trivet';
import { FC, useCallback, useMemo } from 'react';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { TestSuiteList } from './TestSuiteList';
import { TestSuite } from './TestSuite';
import { TrivetUiTypes } from './TrivetUiTypes';
import { nanoid } from 'nanoid';


const styles = css`
  position: fixed;
  top: 32px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 60;

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
`

export const TrivetRenderer: FC = () => {
  const [{ isOpen }, setState] = useRecoilState(trivetState);

  if (!isOpen) return null;

  return <TrivetContainer onClose={() => setState((s) => ({ ...s, isOpen: false }))} />;
};

export type TrivetContainerProps = {
  onClose: () => void;
};

export const TrivetContainer: FC<TrivetContainerProps> = ({ onClose }) => {
  const [{ testSuites, selectedTestSuiteId, editingTestCaseId }, setState] = useRecoilState(trivetState);
  const selectedTestSuite = useMemo(() => testSuites.find((ts) => ts.id === selectedTestSuiteId), [testSuites, selectedTestSuiteId]);
  const isEditingTestCase = useMemo(() => Boolean(editingTestCaseId) && (selectedTestSuite?.testCases.find((tc) => tc.id === editingTestCaseId) != null), [editingTestCaseId, selectedTestSuite]);
  const updateSelectedTestSuite = useCallback((testSuite: TrivetUiTypes.TrivetTestSuiteWithId) => {
    setState((s) => ({
      ...s,
      testSuites: s.testSuites.map((ts) => ts.id === testSuite.id ? testSuite : ts)
    }));
  }, [setState]);
  const createNewTestSuite = useCallback(() => {
    setState((s) => ({
      ...s,
      testSuites: [...s.testSuites, { id: nanoid(), testCases: [], testGraph: 'a', validationGraph: 'a' }],
    }));
  }, [setState]);
  const deleteTestSuite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      testSuites: s.testSuites.filter((ts) => ts.id !== id),
    }));
  }, [setState]);
  const setEditingTestCase = useCallback((id: string | undefined) => {
    setState((s) => ({
      ...s,
      editingTestCaseId: id,
    }));
  }, [setState]);
  const deleteTestCase = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      testSuites: s.testSuites.map((ts) => ts.id === selectedTestSuiteId ? { ...ts, testCases: ts.testCases.filter((tc) => tc.id !== id) } : ts),
    }));
  }, [setState, selectedTestSuiteId]);

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
          />
        </div>
        <div className="test-case-column">
          <TestSuite
            testSuite={selectedTestSuite}
            updateTestSuite={updateSelectedTestSuite}
            setEditingTestCase={setEditingTestCase}
            isEditingTestCase={isEditingTestCase}
            editingTestCaseId={editingTestCaseId}
            deleteTestCase={deleteTestCase}
          />
        </div>
      </div>
    </div>
  );
};