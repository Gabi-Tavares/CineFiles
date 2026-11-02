import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useAuth } from '../auth/AuthContext';
import { usePersistentList } from '../hooks/usePersistentList';
import { isFirebaseConfigured } from '../services/firebase';
import {
  FavoriteMovie,
  MovieSummary,
  parseMovieSummary,
  toMovieSummary,
} from './movieCollection';

export const FAVORITES_STORAGE_KEY = '@cinefiles/favorites-v1';

export type FavoritesContextValue = {
  favorites: FavoriteMovie[];
  isLoading: boolean;
  initializationError: string | null;
  retryInitialization: () => void;
  isFavorite: (movieId: number) => boolean;
  toggleFavorite: (movie: MovieSummary) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

function parseFavorites(value: string | null): FavoriteMovie[] {
  if (value === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error('Os favoritos salvos estão inválidos neste dispositivo.');
  }

  return parsed.flatMap((item: unknown): FavoriteMovie[] => {
    const summary = parseMovieSummary(item);
    if (
      summary === null ||
      typeof item !== 'object' ||
      item === null ||
      !('favoritedAt' in item) ||
      typeof item.favoritedAt !== 'string'
    ) {
      return [];
    }
    return [{ ...summary, favoritedAt: item.favoritedAt }];
  });
}

type FavoritesProviderProps = {
  children: ReactNode;
};

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { user } = useAuth();
  const {
    items: favorites,
    isLoading,
    initializationError,
    retryInitialization,
    update,
  } = usePersistentList(
    user ? `${FAVORITES_STORAGE_KEY}:${user.id}` : null,
    user && isFirebaseConfigured ? `users/${user.id}/lists/favorites` : null,
    parseFavorites,
  );

  const isFavorite = useCallback(
    (movieId: number) => favorites.some((movie) => movie.id === movieId),
    [favorites],
  );

  const toggleFavorite = useCallback(
    (movie: MovieSummary) =>
      update((current) => {
        if (current.some((item) => item.id === movie.id)) {
          return current.filter((item) => item.id !== movie.id);
        }
        return [
          { ...toMovieSummary(movie), favoritedAt: new Date().toISOString() },
          ...current,
        ];
      }),
    [update],
  );

  const removeFavorite = useCallback(
    (movieId: number) =>
      update((current) => current.filter((item) => item.id !== movieId)),
    [update],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading,
      initializationError,
      retryInitialization,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    }),
    [
      favorites,
      isLoading,
      initializationError,
      retryInitialization,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites deve ser usado dentro de FavoritesProvider.');
  }
  return context;
}
