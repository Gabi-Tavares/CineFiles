import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchMovies,
  getMovieApiErrorMessage,
  isMovieRequestCanceled,
  Movie,
} from '../api/movieApi';

type FirstPageMode = 'initial' | 'refresh';

function mergeWithoutDuplicates(current: Movie[], incoming: Movie[]): Movie[] {
  const knownIds = new Set(current.map((movie) => movie.id));
  return [
    ...current,
    ...incoming.filter((movie) => !knownIds.has(movie.id)),
  ];
}

export function useMovieCatalog(query: string) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const activeController = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const pageRef = useRef(0);
  const totalPagesRef = useRef(1);
  const isLoadingRef = useRef(true);
  const isRefreshingRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const loadFirstPage = useCallback(
    async (mode: FirstPageMode) => {
      const requestId = ++requestSequence.current;
      activeController.current?.abort();
      const controller = new AbortController();
      activeController.current = controller;

      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      setLoadMoreError(null);
      setError(null);

      isLoadingRef.current = mode === 'initial';
      isRefreshingRef.current = mode === 'refresh';
      setIsLoading(mode === 'initial');
      setIsRefreshing(mode === 'refresh');

      if (mode === 'initial') {
        pageRef.current = 0;
        totalPagesRef.current = 1;
        setMovies([]);
        setPage(0);
        setTotalPages(1);
        setTotalResults(0);
      }

      try {
        const response = await fetchMovies({
          page: 1,
          query,
          signal: controller.signal,
        });

        if (requestId !== requestSequence.current) {
          return;
        }

        const nextTotalPages = Math.max(response.total_pages, 1);
        pageRef.current = response.page;
        totalPagesRef.current = nextTotalPages;
        setMovies(response.results);
        setPage(response.page);
        setTotalPages(nextTotalPages);
        setTotalResults(response.total_results);
      } catch (requestError) {
        if (
          requestId === requestSequence.current &&
          !isMovieRequestCanceled(requestError)
        ) {
          setError(getMovieApiErrorMessage(requestError));
        }
      } finally {
        if (requestId === requestSequence.current) {
          isLoadingRef.current = false;
          isRefreshingRef.current = false;
          setIsLoading(false);
          setIsRefreshing(false);
          if (activeController.current === controller) {
            activeController.current = null;
          }
        }
      }
    },
    [query],
  );

  useEffect(() => {
    void loadFirstPage('initial');

    return () => {
      requestSequence.current += 1;
      activeController.current?.abort();
    };
  }, [loadFirstPage]);

  const refresh = useCallback(() => {
    if (isRefreshingRef.current) {
      return;
    }
    void loadFirstPage('refresh');
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingRef.current ||
      isRefreshingRef.current ||
      isLoadingMoreRef.current ||
      pageRef.current >= totalPagesRef.current
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    const requestId = ++requestSequence.current;
    const controller = new AbortController();
    activeController.current = controller;
    const nextPage = pageRef.current + 1;

    try {
      const response = await fetchMovies({
        page: nextPage,
        query,
        signal: controller.signal,
      });

      if (requestId !== requestSequence.current) {
        return;
      }

      const nextTotalPages = Math.max(response.total_pages, 1);
      pageRef.current = response.page;
      totalPagesRef.current = nextTotalPages;
      setMovies((current) => mergeWithoutDuplicates(current, response.results));
      setPage(response.page);
      setTotalPages(nextTotalPages);
      setTotalResults(response.total_results);
    } catch (requestError) {
      if (
        requestId === requestSequence.current &&
        !isMovieRequestCanceled(requestError)
      ) {
        setLoadMoreError(getMovieApiErrorMessage(requestError));
      }
    } finally {
      if (requestId === requestSequence.current) {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
        if (activeController.current === controller) {
          activeController.current = null;
        }
      }
    }
  }, [query]);

  return {
    movies,
    page,
    totalPages,
    totalResults,
    hasMore: page < totalPages,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadMoreError,
    refresh,
    retry: () => void loadFirstPage('initial'),
    loadMore: () => void loadMore(),
    retryLoadMore: () => void loadMore(),
  };
}
