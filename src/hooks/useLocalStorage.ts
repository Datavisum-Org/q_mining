import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch (error) {
      console.warn(`Failed to load local storage key ${key}`, error);
    }
  }, [key]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.warn(`Failed to persist local storage key ${key}`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
