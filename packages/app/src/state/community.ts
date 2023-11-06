import { atom } from 'recoil';

export const isLoggedInToCommunityState = atom<boolean | undefined>({
  key: 'isLoggedInToCommunity',
  default: undefined,
});
