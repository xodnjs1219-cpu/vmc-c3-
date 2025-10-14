"use client";

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export const useQueryParams = <TParams extends Record<string, string | undefined>>() => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const accumulator = new Map<string, string | undefined>();

    searchParams.forEach((value, key) => {
      accumulator.set(key, value);
    });

    return Object.fromEntries(accumulator.entries()) as TParams;
  }, [searchParams]);

  const setParams = useCallback(
    (next: Partial<TParams>) => {
      const current = new URLSearchParams(searchParams.toString());

      Object.entries(next).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          current.delete(key);
          return;
        }

        current.set(key, value);
      });

      const queryString = current.toString();
      const nextUrl = queryString.length > 0 ? `?${queryString}` : '';

      router.push(nextUrl, { scroll: false });
    },
    [router, searchParams],
  );

  return { params, setParams } as const;
};
