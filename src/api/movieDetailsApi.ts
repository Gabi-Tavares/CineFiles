import axios from 'axios';
import {
  getMovieApiErrorMessage,
  Movie,
  movieApi,
  MovieApiConfigurationError,
} from './movieApi';

const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p';

export type MovieGenre = {
  id: number;
  name: string;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
};

export type SpokenLanguage = {
  iso_639_1: string;
  name: string;
  english_name: string;
};

/**
 * Resposta de `GET /movie/{id}`. A TMDB devolve `genres` detalhado neste
 * endpoint, por isso `genre_ids` (presente apenas nas listagens) é removido.
 */
export type MovieDetails = Omit<Movie, 'genre_ids'> & {
  genres: MovieGenre[];
  runtime: number | null;
  tagline: string | null;
  status: string;
  homepage: string | null;
  imdb_id: string | null;
  production_companies: ProductionCompany[];
  spoken_languages: SpokenLanguage[];
};

type FetchMovieDetailsOptions = {
  signal?: AbortSignal;
};

export class InvalidMovieIdError extends Error {
  constructor() {
    super('O identificador deste filme é inválido.');
    this.name = 'InvalidMovieIdError';
  }
}

export async function fetchMovieDetails(
  movieId: number,
  { signal }: FetchMovieDetailsOptions = {},
): Promise<MovieDetails> {
  if (!Number.isInteger(movieId) || movieId < 1) {
    throw new InvalidMovieIdError();
  }

  const response = await movieApi.get<MovieDetails>(`/movie/${movieId}`, {
    signal,
  });
  return response.data;
}

export function getBackdropUrl(
  backdropPath: string | null,
  size: 'w780' | 'w1280' = 'w780',
): string | null {
  return backdropPath ? `${TMDB_IMAGE_URL}/${size}${backdropPath}` : null;
}

/**
 * Reaproveita as mensagens do catálogo e cobre os casos específicos da busca
 * por ID, que o endpoint de listagem nunca retorna.
 */
export function getMovieDetailsErrorMessage(error: unknown): string {
  if (error instanceof InvalidMovieIdError) {
    return error.message;
  }

  if (
    !(error instanceof MovieApiConfigurationError) &&
    axios.isAxiosError(error) &&
    error.response?.status === 404
  ) {
    return 'Este filme não foi encontrado na TMDB.';
  }

  return getMovieApiErrorMessage(error);
}
