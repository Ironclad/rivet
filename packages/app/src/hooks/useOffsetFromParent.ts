import { useEffect, useState, useRef } from 'react';

export function useOffsetFromParent(parentClassName: string): {
  offset: { top: number; left: number } | undefined;
  ref: React.RefObject<HTMLDivElement>;
} {
  const [offset, setOffset] = useState<{ top: number; left: number }>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateOffset = () => {
      let element = ref.current;
      const parent = document.getElementsByClassName(parentClassName)[0];

      if (!element || !parent) {
        setOffset(undefined);
        return;
      }

      let top = 0;
      let left = 0;
      while (element && element !== parent) {
        top += element.offsetTop || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent as HTMLDivElement;
      }

      setOffset({ top, left });
    };

    calculateOffset();
    window.addEventListener('resize', calculateOffset);

    return () => {
      window.removeEventListener('resize', calculateOffset);
    };
  }, [parentClassName]);

  return { offset, ref };
}
