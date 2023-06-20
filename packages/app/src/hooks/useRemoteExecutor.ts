import { ProcessEvents } from '@ironclad/rivet-core';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { graphTesterState } from '../state/graphTester';
import { settingsState } from '../state/settings';
import { setCurrentDebuggerMessageHandler, useRemoteDebugger } from './useRemoteDebugger';

export function useRemoteExecutor() {
  const currentExecution = useCurrentExecution();
  const graph = useRecoilValue(graphState);
  const { graphTest, activeInputPerturbation } = useRecoilValue(graphTesterState);
  const settings = useRecoilValue(settingsState);

  const remoteDebugger = useRemoteDebugger({
    onDisconnect: () => {
      currentExecution.onStop();
    },
  });

  setCurrentDebuggerMessageHandler((message, data) => {
    switch (message) {
      case 'nodeStart':
        currentExecution.onNodeStart(data as ProcessEvents['nodeStart']);
        break;
      case 'nodeFinish':
        currentExecution.onNodeFinish(data as ProcessEvents['nodeFinish']);
        break;
      case 'nodeError':
        currentExecution.onNodeError(data as ProcessEvents['nodeError']);
        break;
      case 'userInput':
        currentExecution.onUserInput(data as ProcessEvents['userInput']);
        break;
      case 'start':
        currentExecution.onStart();
        break;
      case 'done':
        currentExecution.onDone(data as ProcessEvents['done']);
        break;
      case 'abort':
        currentExecution.onAbort(data as ProcessEvents['abort']);
        break;
      case 'partialOutput':
        currentExecution.onPartialOutput(data as ProcessEvents['partialOutput']);
        break;
      case 'graphStart':
        currentExecution.onGraphStart(data as ProcessEvents['graphStart']);
        break;
      case 'graphFinish':
        currentExecution.onGraphFinish(data as ProcessEvents['graphFinish']);
        break;
      case 'nodeOutputsCleared':
        currentExecution.onNodeOutputsCleared(data as ProcessEvents['nodeOutputsCleared']);
        break;
      case 'trace':
        console.log(`remote: ${data}`);
        break;
      case 'pause':
        currentExecution.onPause();
        break;
      case 'resume':
        currentExecution.onResume();
        break;
      case 'error':
        currentExecution.onError(data as ProcessEvents['error']);
        break;
    }
  });

  const tryRunGraph = () => {
    if (
      !remoteDebugger.remoteDebuggerState.started ||
      remoteDebugger.remoteDebuggerState.socket?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    try {
      if (remoteDebugger.remoteDebuggerState.remoteUploadAllowed) {
        remoteDebugger.send('set-dynamic-data', {
          project: {
            ...project,
            graphs: {
              ...project.graphs,
              [graph.metadata!.id!]: graphTest?.testInputs?.[activeInputPerturbation]
                ? updateGraphWithTestValues(graph, graphTest.testInputs[activeInputPerturbation]!)
                : graph,
            },
          },
          settings,
        });
      }

      resetExecutionPromise();
      remoteDebugger.send('run', { graphId: graph.metadata!.id! });
      return await executionPromise;
    } catch (e) {
      console.error(e);
      return;
    }
  };

  function tryAbortGraph() {
    console.log('Aborting via remote debugger');
    remoteDebugger.send('abort', undefined);
  }

  function tryPauseGraph() {
    console.log('Pausing via remote debugger');
    remoteDebugger.send('pause', undefined);
  }

  function tryResumeGraph() {
    console.log('Resuming via remote debugger');
    remoteDebugger.send('resume', undefined);
  }

  return {
    remoteDebugger,
    tryRunGraph,
    tryAbortGraph,
    tryPauseGraph,
    tryResumeGraph,
    active: remoteDebugger.remoteDebuggerState.started,
  };
}
