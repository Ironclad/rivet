import { match } from 'ts-pattern';

export type FeatureFlag = 'community';

export function useFeatureFlag(flag: FeatureFlag): boolean {
  return match(flag)
    .with('community', () => import.meta.env.MODE === 'development')
    .otherwise(() => false);
}
