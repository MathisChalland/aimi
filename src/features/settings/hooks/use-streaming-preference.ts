"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "chat-streaming-enabled";

function getSnapshot(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === "true";
}

function getServerSnapshot(): boolean {
  return true;
}

function subscribe(callback: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useStreamingPreference() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: String(value) }),
    );
  }, []);

  return { enabled, toggle };
}
