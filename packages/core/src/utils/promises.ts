export function abortablePromise<T>(p: Promise<T> | (() => Promise<T>), signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Aborted'));
    });
    if (typeof p === 'function') {
      p = p();
    }
    p.then(resolve, reject);
  });
}
