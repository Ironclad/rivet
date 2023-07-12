import { FC, useCallback, useMemo } from "react";
import { TrivetUiTypes } from "./TrivetUiTypes";
import { TestCaseTable } from "./TestCaseTable";
import { InlineEditableTextfield } from "@atlaskit/inline-edit";
import { GraphSelector } from "../DefaultNodeEditor";
import { nanoid } from "nanoid";
import { useRecoilValue } from "recoil";
import { savedGraphsState } from "../../state/savedGraphs";
import { keyBy } from "lodash-es";
import { GraphInputNode, GraphOutputNode, NodeGraph } from "@ironclad/rivet-core";
import { TestCaseEditor } from "./TestCaseEditor";
import { css } from "@emotion/react";

const styles = css`
  min-height: 100%;
  position: relative;

  .test-case-editor {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    z-index: 20;

    border-left: 1px solid var(--grey);
    background-color: var(--grey-darker);
    padding: 10px;
  }
`;

export type TestSuiteProps = {
  testSuite: TrivetUiTypes.TrivetTestSuiteWithId | undefined;
  updateTestSuite: (testSuite: TrivetUiTypes.TrivetTestSuiteWithId) => void;
  setEditingTestCase: (id: string | undefined) => void;
  deleteTestCase: (id: string) => void;
  isEditingTestCase: boolean;
  editingTestCaseId: string | undefined;
};

export const TestSuite: FC<TestSuiteProps> = ({
  testSuite,
  updateTestSuite,
  setEditingTestCase,
  isEditingTestCase,
  editingTestCaseId,
  deleteTestCase,
}) => {
  const savedGraphs = useRecoilValue(savedGraphsState);
  const graphsById = useMemo<Record<string, NodeGraph>>(() => keyBy(savedGraphs, (g) => g.metadata?.id as string), [savedGraphs]);
  const addTestCase = useCallback(() => {
    if (testSuite == null) {
      return;
    }
    const testGraph = graphsById[testSuite.testGraph];
    let inputs: Record<string, unknown> = {};
    let outputs: Record<string, unknown> = {};
    if (testGraph != null) {
      inputs = Object.fromEntries(testGraph.nodes.filter((n): n is GraphInputNode => n.type === 'graphInput').map((n) => [n.data.id, n.data.dataType]));
      outputs = Object.fromEntries(testGraph.nodes.filter((n): n is GraphOutputNode => n.type === 'graphOutput').map((n) => [n.data.id, n.data.dataType]));
    }
    updateTestSuite({
      ...testSuite,
      testCases: [
        ...testSuite.testCases,
        {
          id: nanoid(),
          inputs,
          baselineOutputs: outputs,
        },
      ],
    });
  }, [graphsById, testSuite, updateTestSuite]);

  if (testSuite == null) {
    return <div />;
  }
  return (
    <div css={styles}>
      <div className="test-suite-header" key={testSuite.id}>
        <InlineEditableTextfield
          key={`test-suite-name-${testSuite.id}`}
          label="Test Suite Name"
          placeholder="Test Suite Name"
          onConfirm={(newValue) =>
            updateTestSuite({ ...testSuite, name: newValue })
          }
          defaultValue={testSuite.name ?? 'Untitled Test Suite'}
          readViewFitContainerWidth
        />
        <InlineEditableTextfield
          key={`test-suite-description-${testSuite.id}`}
          label="Description"
          placeholder="Test Suite Description"
          defaultValue={testSuite.description ?? ''}
          onConfirm={(newValue) =>
            updateTestSuite({ ...testSuite, description: newValue })
          }
          readViewFitContainerWidth
        />
        <GraphSelector
          value={testSuite.testGraph}
          name="Test Graph"
          label="Test Graph"
          onChange={(graphId) => updateTestSuite({ ...testSuite, testGraph: graphId })}
          isReadonly={false}
        />
        <GraphSelector
          value={testSuite.validationGraph}
          name="Validation Graph"
          label="Validation Graph"
          onChange={(graphId) => updateTestSuite({ ...testSuite, validationGraph: graphId })}
          isReadonly={false}
        />
      </div>
      <TestCaseTable
        testCases={testSuite.testCases}
        addTestCase={addTestCase}
        setEditingTestCase={setEditingTestCase}
        editingTestCaseId={editingTestCaseId}
        deleteTestCase={deleteTestCase}
      />
      {isEditingTestCase && <div className="test-case-editor">
        <TestCaseEditor key={editingTestCaseId} />
      </div>}
    </div>
  )
};