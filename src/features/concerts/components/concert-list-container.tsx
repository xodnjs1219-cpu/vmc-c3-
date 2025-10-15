"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConcertsQuery } from "@/features/concerts/hooks/useConcertsQuery";
import { ConcertSearchBar } from "@/features/concerts/components/concert-search-bar";
import { ConcertSortDropdown, type ConcertSortValue } from "@/features/concerts/components/concert-sort-dropdown";
import { ConcertGrid } from "@/features/concerts/components/concert-grid";
import { ConcertEmptyState } from "@/features/concerts/components/concert-empty-state";
import { ConcertErrorState } from "@/features/concerts/components/concert-error-state";
import { ConcertListSkeleton } from "@/features/concerts/components/concert-list-skeleton";
import { ConcertPagination } from "@/features/concerts/components/concert-pagination";
import {
  CONCERT_DEFAULT_PAGE_SIZE,
  CONCERT_QUERY_PARAM_KEYS,
  CONCERT_SORT_OPTIONS,
} from "@/features/concerts/constants";
import { useQueryParams } from "@/hooks/useQueryParams";
import {
  ConcertQuerySchema,
  type ConcertQueryParams,
} from "@/features/concerts/lib/dto";

const PAGE_SECTION_CLASS = "mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8";
const HERO_CONTAINER_CLASS = "flex flex-col gap-3 border-b border-gray-200 pb-6";
const HERO_TITLE_CLASS = "text-3xl font-bold text-gray-900 md:text-4xl";
const HERO_SUBTITLE_CLASS = "text-base text-gray-600 md:text-lg";
const CONTROLS_CONTAINER_CLASS = "flex flex-col gap-5";
const TOOLBAR_CLASS = "flex flex-col gap-3 md:flex-row md:items-center md:justify-between";
const RESULT_SUMMARY_CLASS = "text-sm font-medium text-gray-700";
const CONTENT_SECTION_CLASS = "flex flex-col gap-8";
const PAGE_TITLE = "예매 가능한 콘서트";
const PAGE_SUBTITLE = "검색을 통해 원하는 공연을 찾아보세요.";
const RESULT_TEMPLATE = (count: number) => `총 ${count.toLocaleString()}개의 공연`;
const REFETCH_LABEL_CLASS = "text-sm text-gray-500";
const REFETCH_LABEL = "최신 정보를 불러오는 중...";

const normalize = (value: string | undefined) => (value && value.trim().length > 0 ? value.trim() : undefined);

const buildRawParams = (params: Partial<Record<string, string | undefined>>) => ({
  search: normalize(params[CONCERT_QUERY_PARAM_KEYS.search]),
  sort: normalize(params[CONCERT_QUERY_PARAM_KEYS.sort]),
  page: normalize(params[CONCERT_QUERY_PARAM_KEYS.page]),
  limit: normalize(params[CONCERT_QUERY_PARAM_KEYS.limit]) ?? String(CONCERT_DEFAULT_PAGE_SIZE),
});

export function ConcertListContainer() {
  const { params, setParams } = useQueryParams<Partial<Record<string, string | undefined>>>();

  const queryParams = useMemo<ConcertQueryParams>(() => {
    const raw = buildRawParams(params);
    return ConcertQuerySchema.parse(raw);
  }, [params]);

  const [searchValue, setSearchValue] = useState(queryParams.search ?? "");

  useEffect(() => {
    setSearchValue(queryParams.search ?? "");
  }, [queryParams.search]);

  const sortValue = (queryParams.sort ?? CONCERT_SORT_OPTIONS.latest) as ConcertSortValue;

  const handleSearchSubmit = useCallback(() => {
    setParams({
      [CONCERT_QUERY_PARAM_KEYS.search]: normalize(searchValue),
      [CONCERT_QUERY_PARAM_KEYS.page]: "1",
    });
  }, [searchValue, setParams]);

  const handleSortChange = useCallback((nextSort: ConcertSortValue) => {
    setParams({
      [CONCERT_QUERY_PARAM_KEYS.sort]: nextSort,
      [CONCERT_QUERY_PARAM_KEYS.page]: "1",
    });
  }, [setParams]);

  const handlePageChange = useCallback((page: number) => {
    setParams({
      [CONCERT_QUERY_PARAM_KEYS.page]: page.toString(),
    });
  }, [setParams]);

  const { data, isLoading, isError, error, refetch, isFetching } = useConcertsQuery(queryParams);

  const totalItems = data?.pagination.totalItems ?? 0;

  return (
    <section className={PAGE_SECTION_CLASS}>
      <div className={HERO_CONTAINER_CLASS}>
        <h2 className={HERO_TITLE_CLASS}>{PAGE_TITLE}</h2>
        <p className={HERO_SUBTITLE_CLASS}>{PAGE_SUBTITLE}</p>
      </div>

      <div className={CONTROLS_CONTAINER_CLASS}>
        <ConcertSearchBar
          value={searchValue}
          onChange={setSearchValue}
          onSubmit={handleSearchSubmit}
        />
        <div className={TOOLBAR_CLASS}>
          <ResultSummary totalItems={totalItems} />
          <ConcertSortDropdown value={sortValue} onChange={handleSortChange} />
        </div>
      </div>

      <div className={CONTENT_SECTION_CLASS}>
        {isLoading ? <ConcertListSkeleton /> : null}

        {isError && !isLoading ? (
          <ConcertErrorState message={error?.message} onRetry={() => refetch()} />
        ) : null}

        {!isLoading && !isError && data ? (
          data.concerts.length > 0 ? (
            <>
              <ConcertGrid concerts={data.concerts} />
              <ConcertPagination pagination={data.pagination} onChange={handlePageChange} />
            </>
          ) : (
            <ConcertEmptyState />
          )
        ) : null}

        {isFetching && !isLoading ? <span className={REFETCH_LABEL_CLASS}>{REFETCH_LABEL}</span> : null}
      </div>
    </section>
  );
}

function ResultSummary({ totalItems }: { totalItems: number }) {
  if (!totalItems) {
    return null;
  }

  return <span className={RESULT_SUMMARY_CLASS}>{RESULT_TEMPLATE(totalItems)}</span>;
}
