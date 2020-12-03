import { useState } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
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
