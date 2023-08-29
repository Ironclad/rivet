import { useMemo } from 'react';

export function useDownloadUrl() {
  const platform = useMemo(() => {
    if (typeof window === 'undefined') {
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
  }, []);

  const downloadUrl = useMemo(() => {
    switch (platform) {
      case 'mac':
        return 'https://github.com/Ironclad/rivet/releases/latest/download/Rivet.dmg';
      case 'windows':
        return 'https://github.com/Ironclad/rivet/releases/latest';
      case 'linux':
        return 'https://github.com/Ironclad/rivet/releases/latest/download/rivet.AppImage';
      default:
        return 'https://github.com/Ironclad/rivet/releases/latest';
    }
  }, [platform]);

  return downloadUrl;
}
