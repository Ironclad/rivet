import { FC } from "react";
import { TrivetUiTypes } from "./TrivetUiTypes";
import Button from "@atlaskit/button";
import clsx from "clsx";
import { css } from "@emotion/react";

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
`;

export type TestCaseTableProps = {
  testCases: TrivetUiTypes.TrivetTestCaseWithId[];
  addTestCase: () => void;
  deleteTestCase: (id: string) => void;
  setEditingTestCase: (id: string | undefined) => void;
  editingTestCaseId: string | undefined;
};

export const TestCaseTable: FC<TestCaseTableProps> = ({
  testCases,
  addTestCase,
  setEditingTestCase,
  editingTestCaseId,
  deleteTestCase,
}) => {
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
          <th>Inputs</th>
          <th>Outputs</th>
        </tr>
      </thead>
      <tbody>
        {testCases.map((testCase) => (
          <tr key={testCase.id} className={clsx('test-case-row', { selected: editingTestCaseId === testCase.id })} onClick={() => toggleSelected(testCase.id)}>
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