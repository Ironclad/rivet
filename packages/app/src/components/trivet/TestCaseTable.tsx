import { FC, useMemo, MouseEvent } from "react";
import Button from "@atlaskit/button";
import clsx from "clsx";
import { css } from "@emotion/react";
import { TrivetTestCase, TrivetTestCaseResult } from "@ironclad/trivet";
import { keyBy } from "lodash-es";
import { LoadingSpinner } from "../LoadingSpinner";
import { useContextMenu } from "../../hooks/useContextMenu";
import { useStableCallback } from "../../hooks/useStableCallback";
import Portal from "@atlaskit/portal";
import { DropdownItem } from "@atlaskit/dropdown-menu";

const styles = css`
  .test-case-row {
    &:hover {
      background-color: var(--grey-darkish);
    }
    cursor: pointer;
  }
  .test-case-row.selected {
    background-color: var(--primary);
    color: var(--grey-dark);
    &:hover {
      background-color: var(--primary-dark);
    }
  }
  .status-icon {
    width: 20px;
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
  const testCaseResultsById = useMemo(
    () => keyBy(testCaseResults, (tcr) => tcr.id),
    [testCaseResults],
  );
  function toggleSelected(id: string) {
    if (editingTestCaseId === id) {
      setEditingTestCase(undefined);
    } else {
      setEditingTestCase(id);
    }
  };

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
              <td className="status-icon"><TestCaseStatusIcon result={testCaseResultsById[testCase.id]} running={running} /></td>
              <td>{JSON.stringify(testCase.input).slice(0, 20)}</td>
              <td>{JSON.stringify(testCase.expectedOutput).slice(0, 20)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3}>
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
            <DropdownItem onClick={() => selectedTestCaseIdForContextMenu && runTestCase(selectedTestCaseIdForContextMenu)}>Run Test Case</DropdownItem>
            <DropdownItem onClick={() => selectedTestCaseIdForContextMenu && deleteTestCase(selectedTestCaseIdForContextMenu)}>Delete</DropdownItem>
          </div>
        )}
      </Portal>
    </div>
  );
};

const TestCaseStatusIcon: FC<{ result?: TrivetTestCaseResult, running: boolean }> = ({ result, running }) => {
  if (result == null) {
    if (running) {
      return <LoadingSpinner />;
    } else {
      return <div />;
    }
  } else {
    return <div>{result.passing ? '✅' : '❌'}</div>;
  }
};
