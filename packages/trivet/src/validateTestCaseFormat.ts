import { type GraphInputNode, type GraphOutputNode, type NodeGraph } from '@ironclad/rivet-core';
import { type TrivetTestCase } from './trivetTypes.js';

export function validateTestCaseFormat(
  testGraph: NodeGraph,
  testCase: TrivetTestCase,
): {
  valid: boolean;
  missingInputIds: string[];
  missingOutputIds: string[];
} {
  const inputNodes = testGraph.nodes.filter((n): n is GraphInputNode => n.type === 'graphInput');
  const outputNodes = testGraph.nodes.filter((n): n is GraphOutputNode => n.type === 'graphOutput');
  const inputNodeIds = inputNodes.map((n) => n.data.id);
  const outputNodeIds = outputNodes.map((n) => n.data.id);

  const tcInputIds = new Set(Object.keys(testCase.input));
  const missingInputIds = inputNodeIds.filter((id) => !tcInputIds.has(id));

  const tcOutputIds = new Set(Object.keys(testCase.expectedOutput));
  const missingOutputIds = outputNodeIds.filter((id) => !tcOutputIds.has(id));

  return {
    valid: missingInputIds.length === 0 && missingOutputIds.length === 0,
    missingInputIds,
    missingOutputIds,
  };
}
