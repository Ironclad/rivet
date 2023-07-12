import { FC, useMemo } from "react";
import Button from "@atlaskit/button";
import clsx from "clsx";
import { css } from "@emotion/react";
import { TrivetTestCase, TrivetTestCaseResult } from "@ironclad/trivet";
import { keyBy } from "lodash-es";
import { LoadingSpinner } from "../LoadingSpinner";

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

export type TestCaseTableProps = {
  testCases: TrivetTestCase[];
  addTestCase: () => void;
  deleteTestCase: (id: string) => void;
  setEditingTestCase: (id: string | undefined) => void;
  editingTestCaseId: string | undefined;
  testCaseResults: TrivetTestCaseResult[];
  running: boolean;
};

export const TestCaseTable: FC<TestCaseTableProps> = ({
  testCases,
  addTestCase,
  setEditingTestCase,
  editingTestCaseId,
  deleteTestCase,
  testCaseResults,
  running,
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
  return (
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
          <tr key={testCase.id} className={clsx('test-case-row', { selected: editingTestCaseId === testCase.id })} onClick={() => toggleSelected(testCase.id)}>
            <td className="status-icon"><TestCaseStatusIcon result={testCaseResultsById[testCase.id]} running={running} /></td>
            <td>{JSON.stringify(testCase.inputs).slice(0, 20)}</td>
            <td>{JSON.stringify(testCase.baselineOutputs).slice(0, 20)}</td>
            <td>
              <Button onClick={() => deleteTestCase(testCase.id)}>Delete</Button>
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={3}>
            <Button onClick={addTestCase}>Add Test Case</Button>
          </td>
        </tr>
      </tbody>
    </table>
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