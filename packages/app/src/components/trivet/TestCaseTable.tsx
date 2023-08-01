import { FC, useMemo, MouseEvent } from 'react';
import Button from '@atlaskit/button';
import clsx from 'clsx';
import { css } from '@emotion/react';
import { TrivetTestCase, TrivetTestCaseResult } from '@ironclad/trivet';
import { keyBy } from 'lodash-es';
import { LoadingSpinner } from '../LoadingSpinner';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useStableCallback } from '../../hooks/useStableCallback';
import Portal from '@atlaskit/portal';
import { DropdownItem } from '@atlaskit/dropdown-menu';
import { ReactComponent as MultiplyIcon } from 'majesticons/line/multiply-line.svg';
import { ReactComponent as PlayIcon } from 'majesticons/line/play-circle-line.svg';

const styles = css`
  display: grid;
  grid-template-columns: auto 36px 1fr 1fr;
  padding-top: 20px;

  .cell {
    padding: 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    user-select: none;
    display: flex;
    align-items: center;
  }

  .test-case-row {
    cursor: pointer;
    display: contents;

    &:hover .cell:not(.nobg) {
      background-color: var(--grey-darkish);
    }
  }

  .test-case-row.selected {
    .cell:not(.nobg) {
      background-color: var(--primary);
      color: var(--grey-dark);
    }

    &:hover .cell:not(.nobg) {
      background-color: var(--primary-dark);
    }
  }

  .status-icon {
    .failing {
      color: red !important;
    }

    .passing {
      color: var(--success);
    }

    font-size: 20px;
    line-height: 20px;
  }

  .add-test-case {
    grid-column: 2 / span 3;
    margin-top: 8px;
  }

  .run-test-button {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    margin: 0;
    width: 24px;
    height: 24px;
    border-radius: 0;
    background-color: transparent;
    color: var(--foreground);
    border: 0;
    cursor: pointer;

    &:hover {
      background-color: var(--grey-darkish);
      color: var(--primary);
    }
  }
`;

const contextMenuStyles = css`
  position: absolute;
  border: 1px solid var(--grey);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  background: var(--grey-dark);
  min-width: max-content;
`;

export type TestCaseTableProps = {
  testCases: TrivetTestCase[];
  editingTestCaseId: string | undefined;
  testCaseResults: TrivetTestCaseResult[];
  running: boolean;
  onAddTestCase: () => void;
  onDeleteTestCase: (id: string) => void;
  onSetEditingTestCase: (id: string | undefined) => void;
  onRunTestCase: (id: string) => void;
  onDuplicateTestCase: (id: string) => void;
};

export const TestCaseTable: FC<TestCaseTableProps> = ({
  testCases,
  editingTestCaseId,
  testCaseResults,
  running,
  onAddTestCase,
  onSetEditingTestCase,
  onDeleteTestCase,
  onRunTestCase,
  onDuplicateTestCase,
}) => {
  const testCaseResultsById = useMemo(() => keyBy(testCaseResults, (tcr) => tcr.id), [testCaseResults]);
  function toggleSelected(id: string) {
    if (editingTestCaseId === id) {
      onSetEditingTestCase(undefined);
    } else {
      onSetEditingTestCase(id);
    }
  }

  const { contextMenuRef, showContextMenu, contextMenuData, handleContextMenu } = useContextMenu();

  const handleSidebarContextMenu = useStableCallback((e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleContextMenu(e);
  });

  const selectedTestCaseIdForContextMenu = contextMenuData.data
    ? contextMenuData.data?.element.dataset.testcaseid
    : undefined;

  return (
    <div onContextMenu={handleSidebarContextMenu} data-contextmenutype="test-case-table" ref={contextMenuRef}>
      <div css={styles}>
        <div className="cell" />
        <div className="cell" />
        <div className="cell">Inputs</div>
        <div className="cell">Outputs</div>

        {testCases.map((testCase) => (
          <>
            <div className="cell nobg">
              <button className="run-test-button" onClick={() => onRunTestCase(testCase.id)}>
                <PlayIcon />
              </button>
            </div>
            <div
              key={testCase.id}
              className={clsx('test-case-row', { selected: editingTestCaseId === testCase.id })}
              onClick={() => toggleSelected(testCase.id)}
              data-contextmenutype="test-case-item"
              data-testcaseid={testCase.id}
            >
              <div className="cell status-icon">
                <TestCaseStatusIcon result={testCaseResultsById[testCase.id]} running={running} />
              </div>
              <div className="cell">
                <DisplayInputsOrOutputs data={testCase.input} />
              </div>
              <div className="cell">
                <DisplayInputsOrOutputs data={testCase.expectedOutput} />
              </div>
            </div>
          </>
        ))}
        <div className="add-test-case">
          <Button onClick={onAddTestCase}>Add Test Case</Button>
        </div>
      </div>
      <Portal>
        {showContextMenu && contextMenuData.data?.type === 'test-case-table' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem onClick={onAddTestCase}>New Test Case</DropdownItem>
          </div>
        )}
        {showContextMenu && contextMenuData.data?.type === 'test-case-item' && (
          <div
            css={contextMenuStyles}
            className="test-suite-list-context-menu"
            style={{
              zIndex: 500,
              left: contextMenuData.x,
              top: contextMenuData.y,
            }}
          >
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onRunTestCase(selectedTestCaseIdForContextMenu)}
            >
              Run Test Case
            </DropdownItem>
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onDuplicateTestCase(selectedTestCaseIdForContextMenu)}
            >
              Duplicate
            </DropdownItem>
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && onDeleteTestCase(selectedTestCaseIdForContextMenu)}
            >
              Delete
            </DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

const DisplayInputsOrOutputs: FC<{ data: Record<string, unknown> }> = ({ data }) => {
  if (data == null) {
    return JSON.stringify(data);
  }

  const keys = Object.keys(data);

  if (keys.length === 0) {
    return '(Empty)';
  }

  if (keys.length === 1) {
    const value = data[keys[0]!];
    if (typeof value === 'string') {
      return value;
    }

    return JSON.stringify(value);
  }

  return JSON.stringify(data);
};

const TestCaseStatusIcon: FC<{ result?: TrivetTestCaseResult; running: boolean }> = ({ result, running }) => {
  if (result == null) {
    if (running) {
      return <LoadingSpinner />;
    } else {
      return <div />;
    }
  } else {
    return <div className={result.passing ? 'passing' : 'failing'}>{result.passing ? '✓' : <MultiplyIcon />}</div>;
  }
};
