import axios from 'axios';

const TMDB_API_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p';
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_TMDB_PAGE = 500;

const accessToken = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN?.trim();
const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY?.trim();

export type Movie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
  video: boolean;
};

export type MoviePage = {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
};

type FetchMoviesOptions = {
  page?: number;
  query?: string;
  signal?: AbortSignal;
};

export class MovieApiConfigurationError extends Error {
  constructor() {
    super(
      'Configure EXPO_PUBLIC_TMDB_ACCESS_TOKEN ou EXPO_PUBLIC_TMDB_API_KEY no arquivo .env.local.',
    );
    this.name = 'MovieApiConfigurationError';
  }
}

export const movieApi = axios.create({
  baseURL: TMDB_API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  },
  params: {
    ...(apiKey ? { api_key: apiKey } : {}),
    language: 'pt-BR',
  },
});

movieApi.interceptors.request.use((config) => {
  if (!accessToken && !apiKey) {
    throw new MovieApiConfigurationError();
  }
  return config;
});

function getSafePage(page: number): number {
  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }
  return Math.min(page, MAX_TMDB_PAGE);
}

export async function fetchMovies({
  page = 1,
  query = '',
  signal,
}: FetchMoviesOptions = {}): Promise<MoviePage> {
  const normalizedQuery = query.trim();
  const endpoint = normalizedQuery ? '/search/movie' : '/movie/popular';
  const response = await movieApi.get<MoviePage>(endpoint, {
    signal,
    params: {
      region: 'BR',
      page: getSafePage(page),
      ...(normalizedQuery
        ? { query: normalizedQuery, include_adult: false }
        : {}),
    },
  });

  return {
    ...response.data,
    total_pages: Math.min(response.data.total_pages, MAX_TMDB_PAGE),
  };
}

export function getPosterUrl(
  posterPath: string | null,
  size: 'w342' | 'w500' = 'w500',
): string | null {
  return posterPath ? `${TMDB_IMAGE_URL}/${size}${posterPath}` : null;
}

export function isMovieRequestCanceled(error: unknown): boolean {
  return axios.isCancel(error);
}

export function getMovieApiErrorMessage(error: unknown): string {
  if (error instanceof MovieApiConfigurationError) {
    return error.message;
  }

  if (!axios.isAxiosError(error)) {
    return 'Não foi possível carregar os filmes. Tente novamente.';
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'A API demorou para responder. Tente novamente.';
  }

  if (!error.response) {
    return 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
  }

  if (error.response.status === 401 || error.response.status === 403) {
    return 'A credencial da TMDB é inválida ou não tem permissão.';
  }

  if (error.response.status === 429) {
    return 'Muitas solicitações foram feitas. Aguarde um instante e tente novamente.';
  }

  const apiMessage = (error.response.data as { status_message?: unknown } | null)
    ?.status_message;
  return typeof apiMessage === 'string'
    ? apiMessage
    : 'A API de filmes está indisponível no momento. Tente novamente.';
}
