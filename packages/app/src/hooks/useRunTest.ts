import { GraphProcessor, PortId, coerceType } from '@ironclad/rivet-core';
import { toast } from 'react-toastify';
import { useRecoilValue, useRecoilState } from 'recoil';
import { TauriNativeApi } from '../model/native/TauriNativeApi';
import { graphTesterState, GraphTesterResults, GraphTesterInputPerturbationResults } from '../state/graphTester';
import { projectState } from '../state/savedGraphs';
import { settingsState } from '../state/settings';
import { useGraphExecutor } from './useGraphExecutor';

export function useRunTest() {
  const { tryRunGraph } = useGraphExecutor();
  const project = useRecoilValue(projectState);
  const settings = useRecoilValue(settingsState);
  const [{ graphTest }, setState] = useRecoilState(graphTesterState);

  const pushTestResult = (testResult: GraphTesterResults) => {
    setState((s) => ({
      ...s,
      testResults: {
        ...s.testResults,
        [s.graphTest!.id]: [...(s.testResults[s.graphTest!.id] ?? []), testResult],
      },
    }));
  };

  const updateLatestTestResult = (testResult: GraphTesterResults) => {
    setState((s) => ({
      ...s,
      testResults: {
        ...s.testResults,
        [s.graphTest!.id]: [
          ...(s.testResults[s.graphTest!.id] ?? []).slice(0, s.testResults[s.graphTest!.id]!.length - 1),
          testResult,
        ],
      },
    }));
  };

  const runTest = async () => {
    if (!graphTest || !graphTest.testInputs) {
      return;
    }

    const runName = `Run ${new Date().toLocaleTimeString()}`;
    const inputPerturbationResults: GraphTesterInputPerturbationResults[] = [];
    pushTestResult({
      name: runName,
      inputPerturbationResults: inputPerturbationResults.slice(),
      isRunning: true,
    });

    for (let perturbationIdx = 0; perturbationIdx < graphTest.testInputs.length; perturbationIdx++) {
      try {
        setState((s) => ({ ...s, activeInputPerturbation: perturbationIdx, activeTestRunning: true }));
        // Delay, so that state gets set.
        await new Promise((resolve) => setTimeout(resolve, 10));
        const startTime = Date.now();
        const outputs = await tryRunGraph();
        const duration = Date.now() - startTime;
        if (!outputs) {
          // Undefined outputs means error of some kind.
          throw new Error('Error running test');
        }

        const validationOutput: GraphTesterInputPerturbationResults['validationOutput'] = [];

        for (const testValidation of graphTest.testValidations ?? []) {
          const outputValue = outputs[testValidation.outputId];
          if (!outputValue) {
            validationOutput.push({ testName: testValidation.description, passed: false });
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
            validationOutput.push({ testName: testValidation.description, passed: false });
            continue;
          }

          const passOrFails = coerceType(testOutput, 'boolean');
          validationOutput.push({ testName: testValidation.description, passed: passOrFails });
        }

        inputPerturbationResults.push({
          duration,
          testInputIndex: perturbationIdx,
          validationOutput,
        });
        updateLatestTestResult({
          name: runName,
          inputPerturbationResults: inputPerturbationResults.slice(),
          isRunning: true,
        });
      } catch (err: any) {
        toast.error('Error running test: ' + err.message);
        updateLatestTestResult({
          name: runName,
          inputPerturbationResults: inputPerturbationResults.slice(),
          isRunning: false,
        });
        setState((s) => ({ ...s, activeTestRunning: false }));
      }
    }
    updateLatestTestResult({
      name: runName,
      inputPerturbationResults: inputPerturbationResults.slice(),
      isRunning: false,
    });
    setState((s) => ({ ...s, activeTestRunning: false }));
  };
  return runTest;
}
