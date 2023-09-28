import useIsBrowser from '@docusaurus/useIsBrowser';
import { useMemo } from 'react';

export type Platform = 'mac' | 'windows' | 'linux' | 'unknown' | 'server';

export function useDownloadUrl() {
  const isBrowser = useIsBrowser();

  const platform = useMemo((): Platform => {
    if (!isBrowser || typeof window === 'undefined') {
      return 'server';
    }
    if (window.navigator.userAgent.includes('Mac OS X')) {
      return 'mac';
    }
    if (window.navigator.userAgent.includes('Windows')) {
      return 'windows';
    }
    if (window.navigator.userAgent.includes('Linux')) {
      return 'linux';
    }
    return 'unknown';
  }, [isBrowser]);

  const downloadUrl = useMemo(() => {
    switch (platform) {
      case 'mac':
        return 'https://github.com/Ironclad/rivet/releases/latest/download/Rivet.dmg';
      case 'windows':
        return 'https://github.com/Ironclad/rivet/releases/latest/download/Rivet-Setup.exe';
      case 'linux':
        return 'https://github.com/Ironclad/rivet/releases/latest/download/rivet.AppImage';
      default:
        return 'https://github.com/Ironclad/rivet/releases/latest';
    }
  }, [platform]);

  return useMemo(() => ({
    platform,
    downloadUrl,
  }));
}
