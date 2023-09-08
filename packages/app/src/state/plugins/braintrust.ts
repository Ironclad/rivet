import { BTExperimentSummary } from '@ironclad/trivet';
import { atom } from 'recoil';

export type BraintrustSummariesState = {
  brainTrustSummaries?: Record<string, BTExperimentSummary>;
};

export const braintrustSummariesState = atom<BraintrustSummariesState>({
  key: 'braintrustSummariesState',
  default: {},
});
