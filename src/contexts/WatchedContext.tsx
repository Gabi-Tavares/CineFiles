/**
 * STUB — responsabilidade do integrante 4 (RF05/RF06).
 *
 * Mesma situação do `FavoritesContext`: o contrato público já é o definitivo e
 * só o armazenamento é provisório (memória). O que falta fazer aqui:
 *
 *   1. carregar `WATCHED_STORAGE_KEY` em um `useEffect` inicial, alimentando
 *      `isLoading` e `initializationError`;
 *   2. validar o JSON lido, descartando notas fora da faixa 1–5 com
 *      `isValidRating`;
 *   3. gravar com `AsyncStorage.setItem` em `toggleWatched`, `setRating` e
 *      `clearRating`, antes de atualizar o estado.
 *
 * Regra de negócio já embutida: avaliar um filme implica marcá-lo como
 * assistido, e desmarcar como assistido descarta a nota.
 */
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  assertValidRating,
  MovieSummary,
  toMovieSummary,
  WatchedMovie,
} from './movieCollection';

export const WATCHED_STORAGE_KEY = '@cinefiles/watched-v1';

export type WatchedContextValue = {
  watched: WatchedMovie[];
  isLoading: boolean;
  initializationError: string | null;
  isWatched: (movieId: number) => boolean;
  getRating: (movieId: number) => number | null;
  toggleWatched: (movie: MovieSummary) => Promise<void>;
  setRating: (movie: MovieSummary, rating: number) => Promise<void>;
  clearRating: (movieId: number) => Promise<void>;
};

const WatchedContext = createContext<WatchedContextValue | undefined>(undefined);

type WatchedProviderProps = {
  children: ReactNode;
};

export function WatchedProvider({ children }: WatchedProviderProps) {
  const [watched, setWatched] = useState<WatchedMovie[]>([]);

  const isWatched = useCallback(
    (movieId: number) => watched.some((movie) => movie.id === movieId),
    [watched],
  );

  const getRating = useCallback(
    (movieId: number) =>
      watched.find((movie) => movie.id === movieId)?.rating ?? null,
    [watched],
  );

  const toggleWatched = useCallback(async (movie: MovieSummary) => {
    setWatched((current) => {
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
    });
  }, []);

  const setRating = useCallback(async (movie: MovieSummary, rating: number) => {
    assertValidRating(rating);
    setWatched((current) => {
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
  }, []);

  const clearRating = useCallback(async (movieId: number) => {
    setWatched((current) =>
      current.map((item) =>
        item.id === movieId ? { ...item, rating: null } : item,
      ),
    );
  }, []);

  const value = useMemo<WatchedContextValue>(
    () => ({
      watched,
      isLoading: false,
      initializationError: null,
      isWatched,
      getRating,
      toggleWatched,
      setRating,
      clearRating,
    }),
    [watched, isWatched, getRating, toggleWatched, setRating, clearRating],
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
