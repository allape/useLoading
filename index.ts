import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';

export type LoadFunction = (key?: string) => string;

export type LoadedFunction = (key: string) => boolean;

export type IsLoadingFunction = () => boolean;

export type UseLoadingReturn = [ boolean, LoadFunction, LoadedFunction, IsLoadingFunction ];

/**
 * loading hook
 * @param delay 延迟触发更改状态的时间(ms), 避免闪烁
 */
export default function useLoading(
  delay: number = 100
): UseLoadingReturn {
  const [loading, setLoading] = useState(false);
  const [count, plus] = useCounter();

  const { load: globalLoad, loaded: globalLoaded } = useContext(LoadingContext);

  const setLoadingProxy = useCallback((loading: boolean) => {
    setLoading(loading);
  }, [setLoading]);

  const queue = useMemo<string[]>(() => [], []);

  const load = useCallback((key?: string): string => {
    key = key || `${Date.now()}_${Math.random()}_${Math.random()}`;

    if (globalLoad && globalLoad !== load) {
      globalLoad(key);
    }

    queue.push(key);
    plus();
    return key;
  }, [queue, plus, globalLoad]);

  const loaded = useCallback((key: string): boolean => {
    if (globalLoaded && globalLoaded !== loaded) {
      globalLoaded(key);
    }

    const index = queue.indexOf(key);
    if (index !== -1) {
      queue.splice(index, 1);
      plus();
      return true;
    }
    return false;
  }, [queue, plus, globalLoaded]);

  // 最精确的判断当前是否在loading, 用于那些不能依靠loading state更改来监听操作的操作
  const isLoading = useCallback(() => {
    return queue.length > 0;
  }, [queue]);

  useEffect(() => {
    const loading = queue.length > 0;
    if (!loading) {
      const id = setTimeout(() => setLoadingProxy(queue.length > 0), delay);
      return () => clearTimeout(id);
    } else {
      setLoadingProxy(loading);
    }
  }, [count, queue, delay, setLoadingProxy]);

  // useEffect(() => {
  //   if (withAutoClear) {
  //     const intervalId = setInterval(() => {
  //       setLoading(queue.length > 0);
  //     }, 1000);
  //     return () => {
  //       clearInterval(intervalId);
  //     };
  //   }
  // }, [withAutoClear, setLoading, queue]);

  return [ loading, load, loaded, isLoading ];
}

export type PlusFunction = () => void;
/**
 * 计数器, 用于触发key更改的
 * @param initValue 初始值
 */
export function useCounter(initValue: number = 0): [ number, PlusFunction ] {
  const [count, setCount] = useState(initValue);
  const plus = useCallback(() => {
    setCount(c => c === Number.MAX_SAFE_INTEGER ? 1 : (c + 1));
  }, [setCount]);
  return [ count, plus ];
}

export interface LoadingContextValue {
  loading: boolean;
  load?: LoadFunction;
  loaded?: LoadedFunction;
}

export const LoadingContext = React.createContext<LoadingContextValue>({
  loading: false,
  load: undefined,
  loaded: undefined,
});
