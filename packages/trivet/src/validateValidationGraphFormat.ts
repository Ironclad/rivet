import { keyBy } from 'lodash-es';
import { type GraphInputNode, type NodeGraph } from '@ironclad/rivet-core';

export function validateValidationGraphFormat(validationGraph: NodeGraph): { valid: boolean; errorMessages: string[] } {
  const inputNodes = validationGraph.nodes.filter((n): n is GraphInputNode => n.type === 'graphInput');
  const inputNodesById = keyBy(inputNodes, (n) => n.data.id);
  const validationResult = {
    valid: true,
    errorMessages: [] as string[],
  };
  if (inputNodesById.input == null) {
    validationResult.valid = false;
    validationResult.errorMessages.push('Must have an input node with id "input"');
  }
  if (inputNodesById.expectedOutput == null) {
    validationResult.valid = false;
    validationResult.errorMessages.push('Must have an input node with id "expectedOutput"');
  }
  if (inputNodesById.output == null) {
    validationResult.valid = false;
    validationResult.errorMessages.push('Must have an input node with id "output"');
  }
  const outputNodes = validationGraph.nodes.filter((n): n is GraphInputNode => n.type === 'graphOutput');
  if (outputNodes.length === 0) {
    validationResult.valid = false;
    validationResult.errorMessages.push(
      'Must have at least one output node (that returns true/false as string or boolean)',
    );
  }
  const invalidOutputs = outputNodes.filter(
    (n) => n.data.dataType !== 'boolean' && n.data.dataType !== 'string' && n.data.dataType !== 'any',
  );
  if (invalidOutputs.length > 0) {
    validationResult.valid = false;
    validationResult.errorMessages.push(
      `Output nodes must return boolean or string, but found ${invalidOutputs.map((n) => n.data.dataType).join(', ')}`,
    );
  }
  return validationResult;
}
