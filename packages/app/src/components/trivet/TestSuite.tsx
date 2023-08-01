import { FC, useCallback, useMemo } from 'react';
import { TestCaseTable } from './TestCaseTable';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { GraphSelector } from '../DefaultNodeEditor';
import { nanoid } from 'nanoid';
import { useRecoilState, useRecoilValue } from 'recoil';
import { savedGraphsState } from '../../state/savedGraphs';
import { keyBy } from 'lodash-es';
import { GraphInputNode, GraphOutputNode, NodeGraph } from '@ironclad/rivet-core';
import { TestCaseEditor } from './TestCaseEditor';
import { css } from '@emotion/react';
import {
  TrivetTestCase,
  TrivetTestSuite,
  validateTestCaseFormat,
  validateValidationGraphFormat,
} from '@ironclad/trivet';
import { trivetState } from '../../state/trivet';
import Button from '@atlaskit/button';
import { TryRunTests } from './api';
import { useStableCallback } from '../../hooks/useStableCallback';

const styles = css`
  min-height: 100%;
  position: relative;
  display: flex;

  .test-suite-area {
    padding: 48px 20px 20px 20px;
    flex: 1 1 auto;
  }

  .test-suite-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;

    form {
      margin: 0;
      min-width: 300px;
    }
  }

  .graph-selectors {
    flex: 1;
  }

  .test-case-editor {
    width: 400px;
    z-index: 20;
    flex: 1 0 auto;

    border-left: 1px solid var(--grey);
    background-color: var(--grey-darker);
    padding: 10px;
    // Left box shadow
    box-shadow: -10px 0 8px 0px rgba(0, 0, 0, 0.2);
  }
`;

export const TestSuite: FC<{ tryRunTests: TryRunTests }> = ({ tryRunTests }) => {
  const [{ testSuites, selectedTestSuiteId, editingTestCaseId, recentTestResults, runningTests }, setState] =
    useRecoilState(trivetState);
  const savedGraphs = useRecoilValue(savedGraphsState);

  const testSuite = useMemo(
    () => testSuites.find((ts) => ts.id === selectedTestSuiteId),
    [testSuites, selectedTestSuiteId],
  );
  const isEditingTestCase = useMemo(
    () => Boolean(editingTestCaseId) && testSuite?.testCases.find((tc) => tc.id === editingTestCaseId) != null,
    [editingTestCaseId, testSuite],
  );
  const updateTestSuite = useCallback(
    (testSuite: TrivetTestSuite) => {
      setState((s) => ({
        ...s,
        testSuites: s.testSuites.map((ts) => (ts.id === testSuite.id ? testSuite : ts)),
      }));
    },
    [setState],
  );

  const setEditingTestCase = useCallback(
    (id: string | undefined) => {
      setState((s) => ({
        ...s,
        editingTestCaseId: id,
      }));
    },
    [setState],
  );
  const deleteTestCase = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        testSuites: s.testSuites.map((ts) =>
          ts.id === selectedTestSuiteId ? { ...ts, testCases: ts.testCases.filter((tc) => tc.id !== id) } : ts,
        ),
      }));
    },
    [setState, selectedTestSuiteId],
  );

  const duplicateTestCase = useStableCallback((id: string) => {
    if (testSuite == null) {
      return;
    }
    const testCase = testSuite.testCases.find((tc) => tc.id === id);
    if (testCase == null) {
      return;
    }
    updateTestSuite({
      ...testSuite,
      testCases: [...testSuite.testCases, { ...testCase, id: nanoid() }],
    });
  });

  const latestResult = useMemo(
    () => recentTestResults?.testSuiteResults.find((tsr) => tsr.id === selectedTestSuiteId),
    [recentTestResults, selectedTestSuiteId],
  );

  const graphsById = useMemo<Record<string, NodeGraph>>(
    () => keyBy(savedGraphs, (g) => g.metadata?.id as string),
    [savedGraphs],
  );
  const testGraph = useMemo(() => {
    if (testSuite?.testGraph == null) {
      return;
    }
    return graphsById[testSuite.testGraph];
  }, [graphsById, testSuite?.testGraph]);

  const addTestCase = useCallback(() => {
    if (testSuite == null) {
      return;
    }
    let input: Record<string, unknown> = {};
    let output: Record<string, unknown> = {};
    if (testGraph != null) {
      input = Object.fromEntries(
        testGraph.nodes
          .filter((n): n is GraphInputNode => n.type === 'graphInput')
          .map((n) => [n.data.id, n.data.dataType]),
      );
      output = Object.fromEntries(
        testGraph.nodes
          .filter((n): n is GraphOutputNode => n.type === 'graphOutput')
          .map((n) => [n.data.id, n.data.dataType]),
      );
    }
    updateTestSuite({
      ...testSuite,
      testCases: [
        ...testSuite.testCases,
        {
          id: nanoid(),
          input,
          expectedOutput: output,
        },
      ],
    });
  }, [testGraph, testSuite, updateTestSuite]);

  const validationGraphValidationResults = useMemo(() => {
    if (testSuite?.validationGraph == null) {
      return undefined;
    }
    const validationGraph = graphsById[testSuite.validationGraph];
    if (validationGraph == null) {
      return undefined;
    }
    return validateValidationGraphFormat(validationGraph);
  }, [graphsById, testSuite?.validationGraph]);

  const runTestCase = useCallback(
    (id: string, iterationCount?: number) => {
      if (selectedTestSuiteId == null) {
        return;
      }
      tryRunTests({
        testSuiteIds: [selectedTestSuiteId],
        testCaseIds: [id],
        iterationCount: iterationCount ?? 1,
      });
    },
    [tryRunTests, selectedTestSuiteId],
  );

  const testCaseValidationResults = useMemo(() => {
    if (testGraph == null) {
      return { valid: false };
    }
    const testCaseValidations = testSuite?.testCases.map((tc) => validateTestCaseFormat(testGraph, tc));
    return {
      valid: testCaseValidations != null && testCaseValidations?.every((v) => v.valid),
      testCaseValidations,
    };
  }, [testGraph, testSuite?.testCases]);

  const fixInvalidTestCases = useCallback(() => {
    if (
      testSuite?.testCases == null ||
      testCaseValidationResults == null ||
      testCaseValidationResults.valid ||
      testCaseValidationResults.testCaseValidations == null
    ) {
      return;
    }
    const fixedTestCases = testCaseValidationResults.testCaseValidations.map(
      (v, idx): TrivetTestCase =>
        v.valid
          ? testSuite?.testCases[idx]!
          : fixTestCase(testSuite?.testCases[idx]!, v.missingInputIds, v.missingOutputIds),
    );
    updateTestSuite({
      ...testSuite,
      testCases: fixedTestCases,
    });
  }, [testCaseValidationResults, testSuite, updateTestSuite]);

  if (testSuite == null) {
    return <div />;
  }
  return (
    <div css={styles}>
      <div className="test-suite-area">
        <div className="test-suite-header" key={testSuite.id}>
          <InlineEditableTextfield
            key={`test-suite-name-${testSuite.id}`}
            label="Test Suite Name"
            placeholder="Test Suite Name"
            onConfirm={(newValue) => updateTestSuite({ ...testSuite, name: newValue })}
            defaultValue={testSuite.name ?? 'Untitled Test Suite'}
            readViewFitContainerWidth
          />
          <InlineEditableTextfield
            key={`test-suite-description-${testSuite.id}`}
            label="Description"
            placeholder="Test Suite Description"
            defaultValue={testSuite.description ?? ''}
            onConfirm={(newValue) => updateTestSuite({ ...testSuite, description: newValue })}
            readViewFitContainerWidth
          />
          <div className="graph-selectors">
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

          {validationGraphValidationResults != null && !validationGraphValidationResults.valid && (
            <div className="validation-results">
              ⚠️ Validation graph requires a specific format. Please fix the following errors:
              <ul>
                {validationGraphValidationResults.errorMessages.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          {testCaseValidationResults != null && !testCaseValidationResults.valid && (
            <div className="validation-results">
              <p>⚠️ Test cases must match the inputs and outputs of the test graph.</p>
              <Button onClick={fixInvalidTestCases}>Fix Invalid Test Cases</Button>
            </div>
          )}
          <TestCaseTable
            testCases={testSuite.testCases}
            editingTestCaseId={editingTestCaseId}
            running={runningTests}
            testCaseResults={latestResult?.testCaseResults ?? []}
            onAddTestCase={addTestCase}
            onSetEditingTestCase={setEditingTestCase}
            onDeleteTestCase={deleteTestCase}
            onRunTestCase={runTestCase}
            onDuplicateTestCase={duplicateTestCase}
          />
        </div>
      </div>
      {isEditingTestCase && (
        <div className="test-case-editor">
          <TestCaseEditor key={editingTestCaseId} />
        </div>
      )}
    </div>
  );
};

function fixTestCase(testCase: TrivetTestCase, missingInputs: string[], missingOutputs: string[]): TrivetTestCase {
  return {
    ...testCase,
    input: {
      ...testCase.input,
      ...Object.fromEntries(missingInputs.map((input) => [input, ''])),
    },
    expectedOutput: {
      ...testCase.expectedOutput,
      ...Object.fromEntries(missingOutputs.map((output) => [output, ''])),
    },
  };
}
