import { ProcessEvents } from '@ironclad/rivet-core';
import { useCurrentExecution } from './useCurrentExecution';
import { useRecoilValue } from 'recoil';
import { graphState } from '../state/graph';
import { settingsState } from '../state/settings';
import { setCurrentDebuggerMessageHandler, useRemoteDebugger } from './useRemoteDebugger';
import { fillMissingSettingsFromEnvironmentVariables } from '../utils/tauri';
import { projectState } from '../state/savedGraphs';

export function useRemoteExecutor() {
  const currentExecution = useCurrentExecution();
  const graph = useRecoilValue(graphState);
  const savedSettings = useRecoilValue(settingsState);
  const project = useRecoilValue(projectState);

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
      case 'graphAbort':
        currentExecution.onGraphAbort(data as ProcessEvents['graphAbort']);
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

  const tryRunGraph = async () => {
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
              [graph.metadata!.id!]: graph,
            },
          },
          settings: await fillMissingSettingsFromEnvironmentVariables(savedSettings),
        });
      }

      remoteDebugger.send('run', { graphId: graph.metadata!.id! });
    } catch (e) {
      console.error(e);
    }
    return;
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
