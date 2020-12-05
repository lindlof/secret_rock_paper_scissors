import { useState } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T, defaults?: T) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const itemStr = window.localStorage.getItem(key);
      if (!itemStr) return initialValue;
      const item = JSON.parse(itemStr);
      if (typeof item === 'object') {
        return { ...defaults, ...item };
      }
      return item;
    } catch {
      return initialValue;
    }
  });
  const setValue = (value: T, store: boolean = true) => {
    try {
      setStoredValue((current: T) => {
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

  return [storedValue, setValue];
};
