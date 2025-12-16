// src/lib/test-result-cache.ts
import type { Test } from '@/types/test-schema';

const CACHE_KEY = 'mm_test_result_cache_v1';

export type TestResultSnapshot = {
  attemptId: string;
  test: Test;
  topic?: string | null;
  difficulty?: string | null;
  savedAt: string; // ISO
};

type ResultCache = Record<string, TestResultSnapshot>;

function safeLoad(): ResultCache {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ResultCache;
  } catch {
    return {};
  }
}

function saveAll(cache: ResultCache) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function getTestResultFromCache(
  attemptId: string,
): TestResultSnapshot | null {
  const cache = safeLoad();
  return cache[attemptId] ?? null;
}

export function saveTestResultToCache(
  attemptId: string,
  snapshot: Omit<TestResultSnapshot, 'savedAt' | 'attemptId'> & {
    savedAt?: string;
  },
) {
  const cache = safeLoad();
  cache[attemptId] = {
    attemptId,
    test: snapshot.test,
    topic: snapshot.topic,
    difficulty: snapshot.difficulty,
    savedAt: snapshot.savedAt ?? new Date().toISOString(),
  };
  saveAll(cache);
}
