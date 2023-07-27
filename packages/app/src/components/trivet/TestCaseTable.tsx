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

const styles = css`
  display: grid;
  grid-template-columns: 36px 1fr 1fr;
  padding-top: 20px;

  tr,
  thead,
  tbody {
    display: contents;
  }

  td {
    padding: 8px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    user-select: none;
  }

  .test-case-row {
    cursor: pointer;

    &:hover td {
      background-color: var(--grey-darkish);
    }
  }

  .test-case-row.selected {
    td {
      background-color: var(--primary);
      color: var(--grey-dark);
    }

    &:hover td {
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
    grid-column: span 3;
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
  addTestCase: () => void;
  deleteTestCase: (id: string) => void;
  setEditingTestCase: (id: string | undefined) => void;
  editingTestCaseId: string | undefined;
  testCaseResults: TrivetTestCaseResult[];
  running: boolean;
  runTestCase: (id: string) => void;
};

export const TestCaseTable: FC<TestCaseTableProps> = ({
  testCases,
  addTestCase,
  setEditingTestCase,
  editingTestCaseId,
  deleteTestCase,
  testCaseResults,
  running,
  runTestCase,
}) => {
  const testCaseResultsById = useMemo(() => keyBy(testCaseResults, (tcr) => tcr.id), [testCaseResults]);
  function toggleSelected(id: string) {
    if (editingTestCaseId === id) {
      setEditingTestCase(undefined);
    } else {
      setEditingTestCase(id);
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
      <table css={styles}>
        <thead>
          <tr>
            <th />
            <th>Inputs</th>
            <th>Outputs</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((testCase) => (
            <tr
              key={testCase.id}
              className={clsx('test-case-row', { selected: editingTestCaseId === testCase.id })}
              onClick={() => toggleSelected(testCase.id)}
              data-contextmenutype="test-case-item"
              data-testcaseid={testCase.id}
            >
              <td className="status-icon">
                <TestCaseStatusIcon result={testCaseResultsById[testCase.id]} running={running} />
              </td>
              <td>
                <DisplayInputsOrOutputs data={testCase.input} />
              </td>
              <td>
                <DisplayInputsOrOutputs data={testCase.expectedOutput} />
              </td>
            </tr>
          ))}
          <tr>
            <td className="add-test-case">
              <Button onClick={addTestCase}>Add Test Case</Button>
            </td>
          </tr>
        </tbody>
      </table>
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
            <DropdownItem onClick={addTestCase}>New Test Case</DropdownItem>
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
              onClick={() => selectedTestCaseIdForContextMenu && runTestCase(selectedTestCaseIdForContextMenu)}
            >
              Run Test Case
            </DropdownItem>
            <DropdownItem
              onClick={() => selectedTestCaseIdForContextMenu && deleteTestCase(selectedTestCaseIdForContextMenu)}
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
