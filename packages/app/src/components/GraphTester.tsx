import React, { ChangeEvent, FC, useMemo, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { GraphTesterResults, graphTesterState } from '../state/graphTester';
import { css } from '@emotion/react';
import { InlineEditableTextfield } from '@atlaskit/inline-edit';
import {
  ChartNode,
  DataValue,
  GraphId,
  GraphInputNode,
  GraphOutputNode,
  NodeGraph,
  NodeGraphTest,
  NodeGraphTestInputData,
  NodeGraphTestValidation,
  PortId,
} from '@ironclad/rivet-core';
import { graphState, nodesOfTypeState } from '../state/graph';
import { GraphSelector } from './DefaultNodeEditor';
import { Field, HelperMessage, Label } from '@atlaskit/form';
import Select from '@atlaskit/select';
import TextArea from '@atlaskit/textarea';
import TextField from '@atlaskit/textfield';
import Button from '@atlaskit/button';
import { LoadingSpinner } from './LoadingSpinner';
import { groupBy } from 'lodash-es';
import { useRunTest } from '../hooks/useRunTest';
import { useStableCallback } from '../hooks/useStableCallback';

const styles = css`
  position: fixed;
  top: 32px;
  left: 0;
  bottom: 0;
  background-color: var(--grey-darker);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 60;
  width: 600px;
  overflow-y: scroll;

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

  .graph-tester-result-item {
    position: relative;
    margin-left: 40px;
    .graph-tester-result-item-status {
      position: absolute;
      left: -40px;
      width: 40px;
      align-items: center;
    }
  }

  .stat-item {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    &:hover {
      background-color: var(--grey-dark);
    }
    .stat-expand-control {
      width: 40px;
    }
    .stat-label-and-value {
      flex-grow: 1;
    }
    .stat-bar {
      width: 250px;
      margin: 10px;
      .stat-bar-fill {
        height: 20px;
      }
    }
    .stat-children {
      margin-left: 40px;
      width: 100%;
    }
  }
`;

export const GraphTesterRenderer: FC = () => {
  const [{ isOpen }, setState] = useRecoilState(graphTesterState);

  const close = useStableCallback(() => {
    setState((s) => ({ ...s, isOpen: false, graphTest: undefined }));
  });

  if (!isOpen) {
    return null;
  }

  return <GraphTester onClose={close} />;
};

export interface GraphTesterProps {
  onClose: () => void;
}

export const GraphTester: FC<GraphTesterProps> = ({ onClose }) => {
  const [{ graphTest, testResults, activeInputPerturbation, activeTestRunning }, setState] =
    useRecoilState(graphTesterState);

  const [graph, setGraph] = useRecoilState(graphState);
  const runTest = useRunTest();

  const graphInputs = useRecoilValue(nodesOfTypeState('graphInput'));

  const setTest = (test: NodeGraphTest) => {
    setState((s) => ({ ...s, graphTest: test }));
    setGraph((g) => ({ ...g, testCases: (g.testCases ?? []).map((t) => (t.id === test.id ? test : t)) }));
  };

  const addValidation = useStableCallback(() => {
    if (!graphTest) {
      return;
    }

    setTest({
      ...graphTest,
      testValidations: [
        ...(graphTest.testValidations ?? []),
        { description: '', outputId: '' as PortId, evaluatorGraphId: '' as GraphId },
      ],
    });
  });

  const deleteValidation = useStableCallback((idx: number) => {
    if (!graphTest) {
      return;
    }

    setTest({
      ...graphTest,
      testValidations: [...graphTest.testValidations.slice(0, idx), ...graphTest.testValidations.slice(idx + 1)],
    });
  });

  const setValidation = (v: NodeGraphTestValidation, idx: number) => {
    if (!graphTest) {
      return;
    }

    setTest({
      ...graphTest,
      testValidations: [...graphTest.testValidations.slice(0, idx), v, ...graphTest.testValidations.slice(idx + 1)],
    });
  };

  if (!graphTest) return null;

  return (
    <div css={styles}>
      <Button className="close-graph-tester" appearance="subtle" onClick={onClose}>
        &times;
      </Button>
      <div className="graph-tester-content">
        <div className="graph-tester-metadata">
          <InlineEditableTextfield
            key={`graph-test-${graphTest.id}-name`}
            label="Test Name"
            placeholder="Test Name"
            onConfirm={(newValue) => setTest({ ...graphTest, name: newValue })}
            defaultValue={graphTest.name ?? 'Untitled Test'}
            readViewFitContainerWidth
          />
          <InlineEditableTextfield
            key={`graph-test-${graphTest.id}-description`}
            label="Description"
            placeholder="Description"
            defaultValue={graphTest.description ?? ''}
            onConfirm={(newValue) => setTest({ ...graphTest, description: newValue })}
            readViewFitContainerWidth
          />
        </div>
        <GraphTestInputEditor
          graphInputs={graphInputs}
          input={graphTest.testInputs?.[activeInputPerturbation] ?? { inputs: {} }}
          setInput={(input) =>
            setTest({
              ...graphTest,
              testInputs: graphTest.testInputs
                ? [
                    ...graphTest.testInputs.slice(0, activeInputPerturbation),
                    input,
                    ...graphTest.testInputs.slice(activeInputPerturbation + 1),
                  ]
                : [input],
            })
          }
          activeTestRunning={activeTestRunning}
          numPerturbations={graphTest.testInputs?.length ?? 0}
          activeInputPerturbation={activeInputPerturbation}
          setActiveInputPerturbation={(idx) => setState((s) => ({ ...s, activeInputPerturbation: idx }))}
          addInputPerturbation={() => {
            setTest({
              ...graphTest,
              testInputs: [
                ...graphTest.testInputs,
                graphTest.testInputs[graphTest.testInputs.length - 1] ?? { inputs: {} },
              ],
            });
            setState((s) => ({ ...s, activeInputPerturbation: graphTest.testInputs?.length ?? 0 }));
          }}
        />
        <div className="graph-tester-validations">
          <Label htmlFor="">Validations</Label>
          <div className="graph-tester-validations-list">
            {(graphTest.testValidations ?? []).map((validation, i) => {
              return (
                <GraphTestValidationEditor
                  key={i}
                  validation={validation}
                  setValidation={(v: NodeGraphTestValidation) => setValidation(v, i)}
                  deleteValidation={() => deleteValidation(i)}
                  graph={graph}
                />
              );
            })}
          </div>
          <Button onClick={addValidation}>+ Add Validation</Button>
        </div>
        <hr />
        <div className="graph-tester-results">
          <div className="graph-tester-results-header">
            <Label htmlFor="">Results</Label>
            <Button className="run-tests" onClick={runTest}>
              Run
            </Button>
          </div>
          <div>
            <GraphTestResults
              testResults={testResults[graphTest.id] ?? []}
              setTestResults={(t) => setState((s) => ({ ...s, testResults: { ...s.testResults, [graphTest.id]: t } }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const GraphTestInputEditor: FC<{
  graphInputs: GraphInputNode[];
  input: NodeGraphTestInputData;
  setInput: (input: NodeGraphTestInputData) => void;
  activeTestRunning: boolean;
  numPerturbations: number;
  activeInputPerturbation: number;
  setActiveInputPerturbation: (idx: number) => void;
  addInputPerturbation: () => void;
}> = ({
  graphInputs,
  input,
  setInput,
  activeTestRunning,
  numPerturbations,
  activeInputPerturbation,
  setActiveInputPerturbation,
  addInputPerturbation,
}) => {
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
  return (
    <div className="graph-tester-inputs">
      <Label htmlFor="">Inputs</Label>
      <div className="graph-tester-inputs-nav">
        <Button
          isDisabled={activeTestRunning}
          onClick={() => setActiveInputPerturbation(Math.max(0, activeInputPerturbation - 1))}
        >
          &lt;
        </Button>
        <span>
          Perturbation {activeInputPerturbation + 1} of {numPerturbations}
        </span>
        {activeInputPerturbation === numPerturbations - 1 ? (
          <Button isDisabled={activeTestRunning} onClick={addInputPerturbation}>
            + Add Perturbation
          </Button>
        ) : (
          <Button
            isDisabled={activeTestRunning}
            onClick={() => setActiveInputPerturbation(Math.min(numPerturbations - 1, activeInputPerturbation + 1))}
          >
            &gt;
          </Button>
        )}
      </div>
      <HelperMessage>Input perturbations should represent the same idea, expressed differently.</HelperMessage>
      {inputEntries.map(({ id, title, dataType, value }) => {
        return (
          <div key={id}>
            <Field name={`input-${id}`} label={`${id} (${title})`} isDisabled={activeTestRunning}>
              {({ fieldProps }) => (
                <TextArea
                  {...fieldProps}
                  value={String(value?.value ?? '')}
                  onChange={(e) => {
                    setInput({
                      ...input,
                      inputs: {
                        ...input.inputs,
                        [id]: { type: dataType, value: e.target.value as any } as DataValue,
                      },
                    });
                  }}
                />
              )}
            </Field>
          </div>
        );
      })}
    </div>
  );
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
  return (
    <div className="graph-tester-validation-item">
      <Button className="delete-graph-tester-validation-item" onClick={deleteValidation} appearance="subtle">
        &times;
      </Button>
      <div>
        <Field name="validationDescription" label="Validation Description">
          {({ fieldProps }) => (
            <TextField
              {...fieldProps}
              value={validation.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setValidation({ ...validation, description: e.target.value })
              }
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
  );
};

const GraphTestResults: FC<{
  testResults: GraphTesterResults[];
  setTestResults: (t: GraphTesterResults[]) => void;
}> = ({ testResults, setTestResults }) => {
  const setTestResult = (testResult: GraphTesterResults, idx: number) => {
    setTestResults([...testResults.slice(0, idx), testResult, ...testResults.slice(idx + 1)]);
  };

  const deleteTestResult = (idx: number) => {
    setTestResults([...testResults.slice(0, idx), ...testResults.slice(idx + 1)]);
  };

  const maxDuration = useMemo(() => {
    return Math.max(...testResults.map((r) => Math.max(...r.inputPerturbationResults.map((r) => r.duration))));
  }, [testResults]);

  return (
    <div className="graph-tester-results-list">
      {testResults.map((result, i) => {
        return (
          <GraphTestResultItem
            key={i}
            testResult={result}
            isRunning={Boolean(result.isRunning) && i === testResults.length - 1}
            setTestResult={(r) => setTestResult(r, i)}
            deleteTestResult={() => deleteTestResult(i)}
            maxDuration={maxDuration}
          />
        );
      })}
    </div>
  );
};

const GraphTestResultItem: FC<{
  testResult: GraphTesterResults;
  setTestResult: (r: GraphTesterResults) => void;
  deleteTestResult: () => void;
  maxDuration: number;
  isRunning: boolean;
}> = ({ testResult, setTestResult, deleteTestResult, maxDuration, isRunning }) => {
  const durationInfo = useMemo(() => {
    const durations = testResult.inputPerturbationResults.map((r) => r.duration);
    return {
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    };
  }, [testResult]);
  const perturbationInfo = useMemo(() => {
    const passed = testResult.inputPerturbationResults.map((r) => r.validationOutput.every((v) => v.passed));
    return {
      passed: passed.filter((p) => p).length,
      failed: passed.filter((p) => !p).length,
      total: passed.length,
    };
  }, [testResult]);
  const validationInfo = useMemo(() => {
    const validations = testResult.inputPerturbationResults.flatMap((r, perturbationIdx) =>
      r.validationOutput.map((validationOutput, validationIdx) => ({
        perturbationIdx,
        validationIdx,
        validationOutput,
      })),
    );
    return Object.values(groupBy(validations, (v) => v.validationIdx)).map((v) => {
      return {
        testName: v[0]?.validationOutput.testName,
        passed: v.every((v) => v.validationOutput.passed),
        perturbations: v,
      };
    });
  }, [testResult]);
  return (
    <div className="graph-tester-result-item">
      <div className="graph-tester-result-item-status">
        {isRunning ? (
          <LoadingSpinner />
        ) : (
          <Button className="graph-tester-result-item-delete" onClick={deleteTestResult} appearance="subtle">
            &times;
          </Button>
        )}
      </div>
      <InlineEditableTextfield
        key="resultName"
        label="Name"
        placeholder="Test result name"
        onConfirm={(newValue) => {
          setTestResult({ ...testResult, name: newValue });
        }}
        defaultValue={testResult.name}
        readViewFitContainerWidth
      />
      <GraphTestResultStatistic
        label="Average Latency"
        helpText="Measures latency"
        value={testResult.inputPerturbationResults.length > 0 && <>{durationInfo.avg}ms</>}
        barLength={testResult.inputPerturbationResults.length > 0 ? durationInfo.avg / maxDuration : 0}
        barColor="teal"
      >
        <div>
          {testResult.inputPerturbationResults.map((r, i) => {
            return (
              <GraphTestResultStatistic
                key={i}
                label={`Perturbation ${i + 1}`}
                value={r.duration + 'ms'}
                barLength={r.duration / maxDuration}
                barColor="teal"
              />
            );
          })}
        </div>
      </GraphTestResultStatistic>

      <GraphTestResultStatistic
        label="Passing Perturbations"
        helpText="Measures robustness to user input"
        value={
          testResult.inputPerturbationResults.length > 0 && (
            <>
              {perturbationInfo.passed} / {perturbationInfo.total}
            </>
          )
        }
        barLength={perturbationInfo.total > 0 ? perturbationInfo.passed / perturbationInfo.total : 0}
        barColor="green"
      >
        {testResult.inputPerturbationResults.map((r, i) => {
          return (
            <GraphTestResultStatistic
              key={i}
              label={`Perturbation ${i + 1}`}
              value={
                r.validationOutput.length > 0 && (
                  <>
                    {r.validationOutput.filter((v) => v.passed).length} / {r.validationOutput.length}
                  </>
                )
              }
              barLength={
                r.validationOutput.length > 0
                  ? r.validationOutput.filter((v) => v.passed).length / r.validationOutput.length
                  : 0
              }
              barColor="green"
            >
              {r.validationOutput.map((v, i2) => {
                return (
                  <p key={i2}>
                    {v.passed ? '✅' : '❌'} {v.testName}
                  </p>
                );
              })}
            </GraphTestResultStatistic>
          );
        })}
      </GraphTestResultStatistic>

      <GraphTestResultStatistic
        label="Passing Validations"
        helpText="Measure correctness of output"
        value={
          testResult.inputPerturbationResults.length > 0 && (
            <>
              {validationInfo.filter(({ passed }) => passed).length} / {validationInfo.length}
            </>
          )
        }
        barLength={
          validationInfo.length > 0 ? validationInfo.filter(({ passed }) => passed).length / validationInfo.length : 0
        }
        barColor="green"
      >
        {validationInfo.map((v, i) => {
          return (
            <GraphTestResultStatistic
              key={i}
              label={v.testName}
              value={
                v.perturbations.length > 0 && (
                  <>
                    {v.perturbations.filter((p) => p.validationOutput.passed).length} / {v.perturbations.length}
                  </>
                )
              }
              barLength={
                v.perturbations.length > 0
                  ? v.perturbations.filter((p) => p.validationOutput.passed).length / v.perturbations.length
                  : 0
              }
              barColor="green"
            >
              {v.perturbations.map((perturbation, i2) => {
                return (
                  <p key={i2}>
                    {perturbation.validationOutput.passed ? '✅' : '❌'} Perturbation {i2 + 1}
                  </p>
                );
              })}
            </GraphTestResultStatistic>
          );
        })}
      </GraphTestResultStatistic>
    </div>
  );
};

const GraphTestResultStatistic: FC<{
  label: string | React.ReactNode;
  helpText?: string | React.ReactNode;
  value?: string | React.ReactNode;
  barLength: number; // 0 - 1.0
  barColor: string;
  children?: React.ReactNode;
}> = ({ label, value, barLength, barColor, children, helpText }) => {
  const [showChildren, setShowChildren] = useState(false);
  return (
    <div className="stat-item">
      <div className="stat-expand-control">
        {children && (
          <Button onClick={() => setShowChildren(!showChildren)} appearance="subtle">
            {showChildren ? '-' : '+'}
          </Button>
        )}
      </div>
      <div className="stat-label-and-value">
        <p>
          <strong>{label}:</strong> {value ?? ''}
        </p>
        {helpText && <HelperMessage>{helpText}</HelperMessage>}
      </div>
      <div className="stat-bar">
        <div className="stat-bar-fill" style={{ width: `${barLength * 100}%`, backgroundColor: barColor }} />
      </div>
      {showChildren && children && <div className="stat-children">{children}</div>}
    </div>
  );
};
