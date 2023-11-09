import { useQuery } from '@tanstack/react-query';
import { useRecoilState } from 'recoil';
import { isLoggedInToCommunityState } from '../state/community';
import { getCommunityApi } from '../utils/getCommunityApi';
import { useEffect } from 'react';

export function useIsLoggedInToCommunity() {
  const profileUrl = getCommunityApi('/profile');
  const [isLoggedInToCommunity, setIsLoggedIntoCommunity] = useRecoilState(isLoggedInToCommunityState);

  const { refetch } = useQuery({
    queryKey: ['community-profile'],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch(profileUrl, {
          credentials: 'include',
        });

        if (response.status !== 200) {
          setIsLoggedIntoCommunity(false);
          return { user: null };
        }

        const profile = await response.json();

        if (!profile.user) {
          setIsLoggedIntoCommunity(false);
          return { user: null };
        }

        setIsLoggedIntoCommunity(true);

        return profile;
      } catch (err) {
        setIsLoggedIntoCommunity(false);
        return { user: null };
      }
    },
  });

  useEffect(() => {
    if (isLoggedInToCommunity === undefined) {
      refetch();
    }
  }, [isLoggedInToCommunity, refetch]);

  return isLoggedInToCommunity;
}
