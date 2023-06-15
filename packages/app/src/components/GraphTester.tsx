import { ChangeEvent, FC, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphTesterResults, graphTesterState } from '../state/graphTester';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { ChartNode, DataValue, GraphId, GraphInputNode, GraphOutputNode, GraphProcessor, NodeGraph, NodeGraphTest, NodeGraphTestInputData, NodeGraphTestValidation, PortId, Project, ScalarDataValue, coerceType } from '@ironclad/rivet-core';
import { graphState } from '../state/graph';
import { useGraphExecutor } from '../hooks/useGraphExecutor';
import { projectState } from '../state/savedGraphs';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { settingsState } from '../state/settings';
import { toast } from 'react-toastify';
import { GraphSelector } from './DefaultNodeEditor';
import { Field, Label } from '@atlaskit/form';
import Select from '@atlaskit/select';
import TextArea from '@atlaskit/textarea';
import TextField from '@atlaskit/textfield';

const styles = css`
  position: fixed;
  top: 32px;
  left: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 60;
  width: 600px;

  .close-graph-tester {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
  }

  .graph-tester-content {
    margin: 10px;
  }

  .graph-tester-inputs {
    margin-left: 40px;
    margin-bottom: 20px;
    & > label {
      margin-left: -40px;
    }
  }

  .graph-tester-validations {
    margin-bottom: 20px;
  }

  .graph-tester-validations-list {
    position: relative;
    margin-bottom: 10px;

    .graph-tester-validation-item {
      margin-left: 40px;
    }
    .delete-graph-tester-validation-item {
      position: absolute;
      left: 0;
    }
  }

  .graph-tester-results-header {
    display: flex;
    align-items: center;
    label {
      flex-grow: 1;
    }
  }
`;

export const GraphTesterRenderer: FC = () => {
  const [{ isOpen }, setState] = useRecoilState(graphTesterState);

  if (!isOpen) return null;

  return <GraphTester onClose={() => setState((s) => ({ ...s, isOpen: false, graphTest: undefined }))} />;
};

export interface GraphTesterProps {
  onClose: () => void;
}

function useRunTest() {
  const { tryRunGraph } = useGraphExecutor();
  const project = useRecoilValue(projectState);
  const settings = useRecoilValue(settingsState);
  const [{ graphTest }, setState] = useRecoilState(graphTesterState);
  const graph = useRecoilValue(graphState);

  const pushTestResult = (testResult: GraphTesterResults) => {
    setState((s) => ({
      ...s,
      testResults: {
        ...s.testResults,
        [s.graphTest!.id]: [...(s.testResults[s.graphTest!.id] ?? []), testResult],
      },
    }));
  };

  const runTest = async () => {
    if (!graphTest) {
      return;
    }

    try {
      const startTime = Date.now();
      const outputs = await tryRunGraph();
      const duration = Date.now() - startTime;
      if (!outputs) {
        return;
      }

      const validationOutput: GraphTesterResults['validationOutput'] = [];

      for (const testValidation of (graphTest.testValidations ?? [])) {
        const outputValue = outputs[testValidation.outputId];
        if (!outputValue) {
          validationOutput.push({ passed: false });
          continue;
        }

        const processor = new GraphProcessor(project, testValidation.evaluatorGraphId);

        const testOutputs = await processor.processGraph(
          {
            nativeApi: new TauriNativeApi(),
            settings,
          },
          {
            ['input' as PortId]: outputValue,
          },
        );
        const testOutput = testOutputs['output' as PortId];

        if (!testOutput) {
          validationOutput.push({ passed: false });
          continue;
        }

        const passOrFails = coerceType(testOutput, 'boolean');
        validationOutput.push({ passed: passOrFails });
      }

      pushTestResult({
        duration,
        testInputIndex: 0, // TODO
        validationOutput,
      });
    } catch (err: any) {
      toast.error('Error running test: ' + err.message);
    }
  }
  return runTest;
}

export const GraphTester: FC<GraphTesterProps> = ({ onClose }) => {
  const [{ graphTest, testResults }, setState] = useRecoilState(graphTesterState);
  const [graph, setGraph] = useRecoilState(graphState);
  const runTest = useRunTest();

  const graphInputs = useMemo(() => 
    graph.nodes.filter((n): n is GraphInputNode => n.type === 'graphInput'),
   [graph.nodes],
  );

  const setTest = (test: NodeGraphTest) => {
    setState((s) => ({ ...s, graphTest: test }));
    setGraph((g) => ({ ...g, testCases: (g.testCases ?? []).map((t) => t.id === test.id ? test : t) }));
  };

  const addValidation = () => {
      if (!graphTest) return;
      setTest({
        ...graphTest,
        testValidations: [
          ...(graphTest.testValidations ?? []),
          { description: '', outputId: '' as PortId, evaluatorGraphId: '' as GraphId },
        ]
    });
  }

  const deleteValidation = (idx: number) => {
    if (!graphTest) return;
    setTest({
      ...graphTest,
      testValidations: [
        ...graphTest.testValidations.slice(0, idx),
        ...graphTest.testValidations.slice(idx + 1),
      ],
    });
  };

  const setValidation = (v: NodeGraphTestValidation, idx: number) => {
    if (!graphTest) return;
    setTest({
      ...graphTest,
      testValidations: [
        ...graphTest.testValidations.slice(0, idx),
        v,
        ...graphTest.testValidations.slice(idx + 1),
      ],
    });
  };

  if (!graphTest) return null;

  return <div css={styles}>
    <Button className="close-graph-tester" appearance="subtle" onClick={onClose}>
      &times;
    </Button>
    <div className="graph-tester-content">
      <div className="graph-tester-metadata">
        <InlineEditableTextfield
          key={`graph-test-${graphTest.id}-name`}
          label="Test Name"
          placeholder="Test Name"
          onConfirm={(newValue) =>
            setTest({ ...graphTest, name: newValue })
          }
          defaultValue={graphTest.name ?? 'Untitled Test'}
          readViewFitContainerWidth
        />
        <InlineEditableTextfield
          key={`graph-test-${graphTest.id}-description`}
          label="Description"
          placeholder="Description"
          defaultValue={graphTest.description ?? ''}
          onConfirm={(newValue) =>
            setTest({ ...graphTest, description: newValue })
          }
          readViewFitContainerWidth
        />
      </div>
      <GraphTestInputEditor
        graphInputs={graphInputs}
        input={graphTest.testInputs?.[0] ?? { inputs: {}}}
        setInput={(input) => setTest({ ...graphTest, testInputs: [input] })} />
      <div className="graph-tester-validations">
        <Label htmlFor="">Validations</Label>
        <div className="graph-tester-validations-list">
          {(graphTest.testValidations ?? []).map((validation, i) => {
            return <GraphTestValidationEditor
              key={i}
              validation={validation}
              setValidation={(v: NodeGraphTestValidation) => setValidation(v, i)}
              deleteValidation={() => deleteValidation(i)}
              graph={graph} />;
          })}
        </div>
        <Button onClick={addValidation}>+ Add Validation</Button>
      </div>
      <hr />
      <div className="graph-tester-results">
        <div className="graph-tester-results-header">
          <Label htmlFor="">Results</Label>
          <Button className="run-tests" onClick={runTest}>Run</Button>
        </div>
        <div>
          {testResults[graphTest.id]?.map((result, i) => {
            return <div key={i}>
              <div>Duration: {result.duration}ms</div>
              <div>Test Input Index: {result.testInputIndex}</div>
              <div>
                {result.validationOutput.map((validation, i) => {
                  return <div key={i}>
                    <div>Validation {i + 1}</div>
                    <div>Passed: {validation.passed ? 'Yes' : 'No'}</div>
                  </div>;
                })}
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  </div>;
}

const GraphTestInputEditor: FC<{
  graphInputs: GraphInputNode[],
  input: NodeGraphTestInputData,
  setInput: (input: NodeGraphTestInputData) => void
}> = ({ graphInputs, input, setInput }) => {
  const inputEntries = useMemo(() => {
    return graphInputs.map((graphInput) => {
      const value = input.inputs[graphInput.data.id];
      return {
        id: graphInput.data.id,
        title: graphInput.title,
        dataType: graphInput.data.dataType,
        value,
      };
    });
  }, [graphInputs, input]);
  return <div className="graph-tester-inputs">
    <Label htmlFor="">Inputs</Label>
    {inputEntries.map(({ id, title, dataType, value }) => {
      return <div key={id}>
        <Field name={`input-${id}`} label={`${id} (${title})`}>
          {({ fieldProps }) => (
            <TextArea
              {...fieldProps}
              value={String(value?.value ?? '')}
              onChange={(e) => {setInput({
                ...input,
                inputs: {
                  ...input.inputs,
                  [id]: { type: dataType, value: e.target.value as any } as DataValue,
                },
              })}}
            />)}
        </Field>
      </div>;
    })}
  </div>
};

function isGraphOutputNode(n: ChartNode): n is GraphOutputNode {
  return n.type === 'graphOutput';
}

const GraphTestValidationEditor: FC<{
  validation: NodeGraphTestValidation;
  setValidation: (validation: NodeGraphTestValidation) => void;
  deleteValidation: () => void;
  graph: NodeGraph;
}> = ({ validation, setValidation, deleteValidation, graph }) => {
  const outputNodes = useMemo(() => {
    return graph.nodes.filter((n) => isGraphOutputNode(n)) as GraphOutputNode[];
  }, [graph.nodes]);
  const outputOptions = useMemo(() => {
    return outputNodes.map((n) => ({ label: n.data.id, value: n.data.id }));
  }, [outputNodes]);
  const outputInfo = useMemo(() => {
    if (validation.outputId === undefined) return undefined;
    return outputNodes.find((n) => n.data.id === validation.outputId);
  }, [outputNodes, validation?.outputId]);
  return <div className="graph-tester-validation-item">
    <Button className="delete-graph-tester-validation-item" onClick={deleteValidation} appearance="subtle">&times;</Button>
    <div>
      <Field name="validationDescription" label="Validation Description">
        {({ fieldProps }) => (
          <TextField
            {...fieldProps}
            value={validation.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setValidation({ ...validation, description: e.target.value })}
            placeholder="eg. Should contain the best result"
          />
        )}
      </Field>
    </div>
    <div>
      <Field name="outputToValidate" label="Output for Validation">
        {({ fieldProps }) => (
          <Select
            {...fieldProps}
            options={outputOptions}
            value={{ label: outputInfo?.data.id, value: outputInfo?.data.id }}
            onChange={(selected) => setValidation({ ...validation, outputId: selected!.value as PortId })}
          />
        )}
      </Field>
    </div>
    <div>
      <GraphSelector
        label="Evaluator Graph (input must match type; output must be boolean)"
        value={validation.evaluatorGraphId}
        onChange={(selected) => setValidation({ ...validation, evaluatorGraphId: selected as GraphId })}
        isReadonly={false}
        name="evaluator-graph-validation"
      />
    </div>
  </div>
};
