import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type MediaQueryListWithLegacy = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function getSnapshot() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)') as MediaQueryListWithLegacy;
  const listener = () => callback();

  mediaQuery.addEventListener?.('change', listener);
  mediaQuery.addListener?.(listener);

  return () => {
    mediaQuery.removeEventListener?.('change', listener);
    mediaQuery.removeListener?.(listener);
  };
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const preferredScheme = useSyncExternalStore(subscribe, getSnapshot, () => 'light');

  return colorScheme ?? preferredScheme;
}
