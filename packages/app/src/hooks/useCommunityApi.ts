import { useQuery } from '@tanstack/react-query';
import join from 'url-join';
import { type CheckerReturnType, type Checker } from '@recoiljs/refine';
import { toast } from 'react-toastify';

export function useCommunityHost() {
  if (import.meta.env.MODE === 'production') {
    throw new Error('Not implemented yet');
  } else {
    return 'http://localhost:3000';
  }
}

export function useCommunityApi(path?: string) {
  const url = useCommunityHost();

  return join(url, 'api', path || '');
}

export function useCommunityLoginUrl() {
  const url = useCommunityHost();

  return join(url, 'auth/signin');
}

export async function fetchCommunity<T extends Checker<any>>(
  path: string,
  bodyChecker: T,
  init?: RequestInit,
): Promise<CheckerReturnType<T>> {
  const url = useCommunityApi(path);

  const result = await fetch(url, {
    credentials: 'include',
    ...init,
  });

  if (result.status === 401) {
    throw new Error('Unauthorized');
  }

  const data = await result.json();

  const checkerResult = bodyChecker(data);

  if (checkerResult.type === 'failure') {
    toast.error(checkerResult.message);
    throw new Error(checkerResult.message);
  }

  return checkerResult.value;
}
