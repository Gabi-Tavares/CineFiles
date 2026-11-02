import { Movie } from '../api/movieApi';
import { MovieDetails } from '../api/movieDetailsApi';

/**
 * Formato mínimo que as listas pessoais guardam. Mantém o essencial para
 * renderizar um `MovieCard` sem precisar consultar a API novamente, e é o que
 * será persistido no AsyncStorage.
 */
export type MovieSummary = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
};

export type FavoriteMovie = MovieSummary & {
  /** ISO 8601 — momento em que o filme foi favoritado. */
  favoritedAt: string;
};

export type WatchedMovie = MovieSummary & {
  /** ISO 8601 — momento em que o filme foi marcado como assistido. */
  watchedAt: string;
  /** Avaliação pessoal de 1 a 5 estrelas, ou `null` se ainda não avaliado. */
  rating: number | null;
};

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export function toMovieSummary(
  movie: Movie | MovieDetails | MovieSummary,
): MovieSummary {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    vote_count: movie.vote_count,
  };
}

export function parseMovieSummary(value: unknown): MovieSummary | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    !('title' in value) ||
    !('poster_path' in value) ||
    !('release_date' in value) ||
    !('vote_average' in value) ||
    !('vote_count' in value) ||
    typeof value.id !== 'number' ||
    typeof value.title !== 'string' ||
    (value.poster_path !== null && typeof value.poster_path !== 'string') ||
    typeof value.release_date !== 'string' ||
    typeof value.vote_average !== 'number' ||
    typeof value.vote_count !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    poster_path: value.poster_path,
    release_date: value.release_date,
    vote_average: value.vote_average,
    vote_count: value.vote_count,
  };
}

export function isValidRating(rating: number): boolean {
  return (
    Number.isInteger(rating) && rating >= MIN_RATING && rating <= MAX_RATING
  );
}

export function assertValidRating(rating: number): void {
  if (!isValidRating(rating)) {
    throw new Error(
      `A avaliação deve ser um número inteiro de ${MIN_RATING} a ${MAX_RATING}.`,
    );
  }
}
