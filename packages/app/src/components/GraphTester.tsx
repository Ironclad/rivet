import { FC, useMemo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphTesterResults, graphTesterState } from '../state/graphTester';
import { css } from '@emotion/react';
import Button from '@atlaskit/button';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import { DataValue, GraphInputNode, GraphProcessor, NodeGraphTest, NodeGraphTestInputData, PortId, ScalarDataValue, coerceType } from '@ironclad/rivet-core';
import { graphState } from '../state/graph';
import { useGraphExecutor } from '../hooks/useGraphExecutor';
import { projectState } from '../state/savedGraphs';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { settingsState } from '../state/settings';
import { toast } from 'react-toastify';

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
`;

export const GraphTesterRenderer: FC = () => {
  const [{ isOpen }, setState] = useRecoilState(graphTesterState);

  if (!isOpen) return null;

  return <GraphTester onClose={() => setState((s) => ({ isOpen: false }))} />;
};

export interface GraphTesterProps {
  onClose: () => void;
}

function useRunTest() {
  const { tryRunGraph } = useGraphExecutor();
  const project = useRecoilValue(projectState);
  const settings = useRecoilValue(settingsState);
  const [{ graphTest }, setState] = useRecoilState(graphTesterState);

  const pushTestResult = (testResult: GraphTesterResults) => {
    setState((s) => ({ ...s, testResults: [...(s.testResults ?? []), testResult] }));
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
        processor.on('trace', (value) => console.log(value));

        // processor.on('nodeFinish', ({ node, outputs }) => {
        //   if (node.type === 'chat') {
        //     console.log(outputs['response' as PortId]);
        //   }
        // });
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
      <div className="graph-tester-inputs">
        <label>Inputs</label>
        <GraphTestInputEditor
          graphInputs={graphInputs}
          input={graphTest.testInputs?.[0] ?? { inputs: {}}}
          setInput={(input) => setTest({ ...graphTest, testInputs: [input] })} />
      </div>
      <div className="graph-tester-validations">
        <label>Validations</label>
      </div>
      <div className="graph-tester-results">
        <label>Results</label>
        <Button onClick={runTest}>Run</Button>
        <div>
          {testResults?.map((result, i) => {
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
      const value = input.inputs[graphInput.title];
      return {
        id: graphInput.id,
        title: graphInput.title,
        dataType: graphInput.data.dataType,
        value,
      };
    });
  }, [graphInputs, input]);
  return <div>
    {inputEntries.map(({ id, title, dataType, value }) => {
      return <div key={id}>
        <label>{title}</label>
        <input type="text" value={String(value?.value ?? '')} onChange={(e) => {setInput({
          ...input,
          inputs: {
            ...input.inputs,
            [title]: { type: dataType, value: e.target.value as any } as DataValue,
          },
        })}} />
      </div>;
    })}
  </div>
};
