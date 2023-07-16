import { FC, useCallback, useMemo } from "react";
import { TestCaseTable } from "./TestCaseTable";
import { InlineEditableTextfield } from "@atlaskit/inline-edit";
import { GraphSelector } from "../DefaultNodeEditor";
import { nanoid } from "nanoid";
import { useRecoilState, useRecoilValue } from "recoil";
import { savedGraphsState } from "../../state/savedGraphs";
import { keyBy } from "lodash-es";
import { GraphInputNode, GraphOutputNode, NodeGraph } from "@ironclad/rivet-core";
import { TestCaseEditor } from "./TestCaseEditor";
import { css } from "@emotion/react";
import { TrivetTestSuite } from "@ironclad/trivet";
import { trivetState } from "../../state/trivet";
import { useGraphExecutor } from "../../hooks/useGraphExecutor";

const styles = css`
  min-height: 100%;
  position: relative;
  padding-left: 8px;
  padding-top: 8px;

  .test-suite-header {
    max-width: 600px;
  }

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
    // Left box shadow
    box-shadow: -10px 0 8px 0px rgba(0, 0, 0, 0.2);
  }
`;

export const TestSuite: FC = () => {
  const [{ testSuites, selectedTestSuiteId, editingTestCaseId, recentTestResults, runningTests }, setState] = useRecoilState(trivetState);
  const savedGraphs = useRecoilValue(savedGraphsState);
  const { tryRunTests } = useGraphExecutor();

  const testSuite = useMemo(() => testSuites.find((ts) => ts.id === selectedTestSuiteId), [testSuites, selectedTestSuiteId]);
  const isEditingTestCase = useMemo(
    () => Boolean(editingTestCaseId) && (testSuite?.testCases.find((tc) => tc.id === editingTestCaseId) != null),
    [editingTestCaseId, testSuite]);
  const updateTestSuite = useCallback((testSuite: TrivetTestSuite) => {
    setState((s) => ({
      ...s,
      testSuites: s.testSuites.map((ts) => ts.id === testSuite.id ? testSuite : ts)
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

  const latestResult = useMemo(
    () => recentTestResults?.testSuiteResults.find((tsr) => tsr.id === selectedTestSuiteId),
    [recentTestResults, selectedTestSuiteId]
  );

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

  const runTestCase = useCallback((id: string) => {
    if (selectedTestSuiteId == null) {
      return;
    }
    tryRunTests({
      testSuiteIds: [selectedTestSuiteId],
      testCaseIds: [id],
    })
  }, [tryRunTests, selectedTestSuiteId]);

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
        running={runningTests}
        testCaseResults={latestResult?.testCaseResults ?? []}
        runTestCase={runTestCase}
      />
      {isEditingTestCase && <div className="test-case-editor">
        <TestCaseEditor key={editingTestCaseId} />
      </div>}
    </div>
  )
};