import { useCallback, useMemo } from 'react';
import { useStableCallback } from './useStableCallback';
import { type TrivetTestSuite } from '@ironclad/trivet';
import { nanoid } from 'nanoid/non-secure';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { trivetState } from '../state/trivet';
import { type GraphInputNode, type GraphOutputNode, type NodeGraph } from '@ironclad/rivet-core';
import { keyBy } from 'lodash-es';
import { savedGraphsState } from '../state/savedGraphs';

export function useTestSuite(testSuiteId: string | undefined) {
  const [{ testSuites }, setState] = useRecoilState(trivetState);

  const testSuite = testSuites.find((ts) => ts.id === testSuiteId);

  const savedGraphs = useRecoilValue(savedGraphsState);

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

  const updateTestSuite = useCallback(
    (testSuite: TrivetTestSuite) => {
      setState((s) => ({
        ...s,
        testSuites: s.testSuites.map((ts) => (ts.id === testSuite.id ? testSuite : ts)),
      }));
    },
    [setState],
  );

  const addTestCase = useStableCallback((input?: Record<string, unknown>, output?: Record<string, unknown>) => {
    if (testSuite == null) {
      return;
    }

    if (input == null) {
      input = {};
      if (testGraph != null) {
        input = Object.fromEntries(
          testGraph.nodes
            .filter((n): n is GraphInputNode => n.type === 'graphInput')
            .map((n) => [n.data.id, n.data.dataType]),
        );
      }
    }

    if (output == null) {
      output = {};
      if (testGraph != null) {
        output = Object.fromEntries(
          testGraph.nodes
            .filter((n): n is GraphOutputNode => n.type === 'graphOutput')
            .map((n) => [n.data.id, n.data.dataType]),
        );
      }
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
  });

  const setEditingTestCase = useStableCallback((id: string | undefined) => {
    setState((s) => ({
      ...s,
      editingTestCaseId: id,
    }));
  });

  const deleteTestCase = useStableCallback((id: string) => {
    setState((s) => ({
      ...s,
      testSuites: s.testSuites.map((ts) =>
        ts.id === testSuiteId ? { ...ts, testCases: ts.testCases.filter((tc) => tc.id !== id) } : ts,
      ),
    }));
  });

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

  return { addTestCase, updateTestSuite, testGraph, setEditingTestCase, deleteTestCase, duplicateTestCase };
}
