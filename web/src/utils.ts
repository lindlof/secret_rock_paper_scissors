import { useState } from 'react';

export const useLocalStorage = <T>(
  key: string,
  initialValue: T,
  defaults?: T,
): [T, (value: T | Function, store?: boolean) => void, () => T | undefined] => {
  const loadValue = (): T | undefined => {
    try {
      const itemStr = window.localStorage.getItem(key);
      if (!itemStr) return;
      const item = JSON.parse(itemStr);
      if (typeof item === 'object') {
        return { ...defaults, ...item };
      }
      return item;
    } catch {}
  };
  const [storedValue, setStoredValue] = useState(() => {
    const item = loadValue();
    if (item === undefined) return initialValue;
    return item;
  });
  const setValue = (value: T | Function, store: boolean = true) => {
    try {
      setStoredValue((current: T | Function) => {
        const valueToStore = value instanceof Function ? value(current) : value;
        if (store) {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue, loadValue];
};
