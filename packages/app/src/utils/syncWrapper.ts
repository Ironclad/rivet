import { toast } from 'react-toastify';

export function syncWrapper<T extends (...args: any[]) => Promise<void>>(fn: T): () => void {
  return (...args: Parameters<T>) => {
    fn(...args).catch((err) => {
      toast.error(err.message);
    });
  };
}

export function swallowPromise<T extends Promise<void>>(promise: T): void {
  promise.catch((err) => {
    toast.error(err.message);
  });
}
