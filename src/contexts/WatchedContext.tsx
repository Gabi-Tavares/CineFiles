import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePersistentList } from '../hooks/usePersistentList';
import {
  assertValidRating,
  isValidRating,
  MovieSummary,
  parseMovieSummary,
  toMovieSummary,
  WatchedMovie,
} from './movieCollection';

export const WATCHED_STORAGE_KEY = '@cinefiles/watched-v1';

export type WatchedContextValue = {
  watched: WatchedMovie[];
  isLoading: boolean;
  initializationError: string | null;
  retryInitialization: () => void;
  isWatched: (movieId: number) => boolean;
  getRating: (movieId: number) => number | null;
  toggleWatched: (movie: MovieSummary) => Promise<void>;
  setRating: (movie: MovieSummary, rating: number) => Promise<void>;
  clearRating: (movieId: number) => Promise<void>;
};

const WatchedContext = createContext<WatchedContextValue | undefined>(undefined);

function parseWatched(value: string | null): WatchedMovie[] {
  if (value === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error(
      'Os filmes assistidos salvos estão inválidos neste dispositivo.',
    );
  }

  return parsed.flatMap((item: unknown): WatchedMovie[] => {
    const summary = parseMovieSummary(item);
    if (
      summary === null ||
      typeof item !== 'object' ||
      item === null ||
      !('watchedAt' in item) ||
      typeof item.watchedAt !== 'string'
    ) {
      return [];
    }
    const rating =
      'rating' in item &&
      typeof item.rating === 'number' &&
      isValidRating(item.rating)
        ? item.rating
        : null;
    return [{ ...summary, watchedAt: item.watchedAt, rating }];
  });
}

type WatchedProviderProps = {
  children: ReactNode;
};

export function WatchedProvider({ children }: WatchedProviderProps) {
  const { user } = useAuth();
  const {
    items: watched,
    isLoading,
    initializationError,
    retryInitialization,
    update,
  } = usePersistentList(
    user ? `${WATCHED_STORAGE_KEY}:${user.id}` : null,
    parseWatched,
  );

  const isWatched = useCallback(
    (movieId: number) => watched.some((movie) => movie.id === movieId),
    [watched],
  );

  const getRating = useCallback(
    (movieId: number) =>
      watched.find((movie) => movie.id === movieId)?.rating ?? null,
    [watched],
  );

  const toggleWatched = useCallback(
    (movie: MovieSummary) =>
      update((current) => {
        if (current.some((item) => item.id === movie.id)) {
          return current.filter((item) => item.id !== movie.id);
        }
        return [
          {
            ...toMovieSummary(movie),
            watchedAt: new Date().toISOString(),
            rating: null,
          },
          ...current,
        ];
      }),
    [update],
  );

  const setRating = useCallback(
    async (movie: MovieSummary, rating: number) => {
      assertValidRating(rating);
      await update((current) => {
        if (current.some((item) => item.id === movie.id)) {
          return current.map((item) =>
            item.id === movie.id ? { ...item, rating } : item,
          );
        }
        return [
          {
            ...toMovieSummary(movie),
            watchedAt: new Date().toISOString(),
            rating,
          },
          ...current,
        ];
      });
    },
    [update],
  );

  const clearRating = useCallback(
    (movieId: number) =>
      update((current) =>
        current.map((item) =>
          item.id === movieId ? { ...item, rating: null } : item,
        ),
      ),
    [update],
  );

  const value = useMemo<WatchedContextValue>(
    () => ({
      watched,
      isLoading,
      initializationError,
      retryInitialization,
      isWatched,
      getRating,
      toggleWatched,
      setRating,
      clearRating,
    }),
    [
      watched,
      isLoading,
      initializationError,
      retryInitialization,
      isWatched,
      getRating,
      toggleWatched,
      setRating,
      clearRating,
    ],
  );

  return (
    <WatchedContext.Provider value={value}>{children}</WatchedContext.Provider>
  );
}

export function useWatched(): WatchedContextValue {
  const context = useContext(WatchedContext);
  if (context === undefined) {
    throw new Error('useWatched deve ser usado dentro de WatchedProvider.');
  }
  return context;
}
