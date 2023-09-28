import { type Child, Command } from '@tauri-apps/api/shell';
import { useEffect } from 'react';

let sidecarStarted = false;
let sidecarProcess: Child | null = null;

async function runSidecar(abortSignal: AbortSignal) {
  try {
    if (sidecarStarted) {
      return;
    }

    const command = Command.sidecar('../../app-executor/dist/app-executor');

    command.stdout.on('data', (data) => {
      console.log('sidecar stdout', data);
    });

    command.stderr.on('data', (data) => {
      console.error('sidecar stderr', data);
    });

    sidecarStarted = true;

    // TODO better API
    const proc = await command.spawn();

    sidecarProcess = proc;

    abortSignal.onabort = () => {
      if (sidecarProcess === proc) {
        sidecarProcess.kill();
        sidecarProcess = null;
        sidecarStarted = false;
      }
    };
  } catch (err) {
    console.error('Error running sidecar', err);

    if (!abortSignal.aborted) {
      setTimeout(() => {
        runSidecar(abortSignal);
      }, 1000);
    }
  }
}

export function useExecutorSidecar(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    runSidecar(controller.signal);

    return () => {
      controller.abort();
    };
  }, [enabled]);
}
