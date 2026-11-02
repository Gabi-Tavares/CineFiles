/**
 * STUB — responsabilidade do integrante 4 (RF04).
 *
 * O estado vive apenas em memória: ao fechar o aplicativo, a lista é perdida.
 * O contrato público (`FavoritesContextValue` + `useFavorites`) já é o
 * definitivo, então a substituição por AsyncStorage não exige mudança em
 * nenhuma tela. O que falta fazer aqui:
 *
 *   1. carregar `FAVORITES_STORAGE_KEY` em um `useEffect` inicial, alimentando
 *      `isLoading` e `initializationError`;
 *   2. validar o JSON lido (ver `parseAccounts` em `src/auth/AuthContext.tsx`);
 *   3. gravar com `AsyncStorage.setItem` dentro de `toggleFavorite` e
 *      `removeFavorite`, antes de atualizar o estado.
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
  FavoriteMovie,
  MovieSummary,
  toMovieSummary,
} from './movieCollection';

export const FAVORITES_STORAGE_KEY = '@cinefiles/favorites-v1';

export type FavoritesContextValue = {
  favorites: FavoriteMovie[];
  isLoading: boolean;
  initializationError: string | null;
  isFavorite: (movieId: number) => boolean;
  toggleFavorite: (movie: MovieSummary) => Promise<void>;
  removeFavorite: (movieId: number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined,
);

type FavoritesProviderProps = {
  children: ReactNode;
};

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);

  const isFavorite = useCallback(
    (movieId: number) => favorites.some((movie) => movie.id === movieId),
    [favorites],
  );

  const toggleFavorite = useCallback(async (movie: MovieSummary) => {
    setFavorites((current) => {
      if (current.some((item) => item.id === movie.id)) {
        return current.filter((item) => item.id !== movie.id);
      }
      return [
        { ...toMovieSummary(movie), favoritedAt: new Date().toISOString() },
        ...current,
      ];
    });
  }, []);

  const removeFavorite = useCallback(async (movieId: number) => {
    setFavorites((current) => current.filter((item) => item.id !== movieId));
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isLoading: false,
      initializationError: null,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    }),
    [favorites, isFavorite, toggleFavorite, removeFavorite],
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
