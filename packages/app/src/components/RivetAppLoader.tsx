import { useState } from 'react';
import { allInitializeStoreFns } from '../state/storage';
import useAsyncEffect from 'use-async-effect';
import { RivetApp } from './RivetApp';

export const RivetAppLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useAsyncEffect(async () => {
    for (const initializeFn of allInitializeStoreFns) {
      await initializeFn();
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <RivetApp />;
};
