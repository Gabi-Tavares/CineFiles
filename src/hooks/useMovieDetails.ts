import { useCallback, useEffect, useRef, useState } from 'react';
import { isMovieRequestCanceled } from '../api/movieApi';
import {
  fetchMovieDetails,
  getMovieDetailsErrorMessage,
  MovieDetails,
} from '../api/movieDetailsApi';

export function useMovieDetails(movieId: number) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeController = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchMovieDetails(movieId, {
        signal: controller.signal,
      });

      if (requestId !== requestSequence.current) {
        return;
      }
      setDetails(response);
    } catch (requestError) {
      if (
        requestId === requestSequence.current &&
        !isMovieRequestCanceled(requestError)
      ) {
        setDetails(null);
        setError(getMovieDetailsErrorMessage(requestError));
      }
    } finally {
      if (requestId === requestSequence.current) {
        setIsLoading(false);
        if (activeController.current === controller) {
          activeController.current = null;
        }
      }
    }
  }, [movieId]);

  useEffect(() => {
    void load();

    return () => {
      requestSequence.current += 1;
      activeController.current?.abort();
    };
  }, [load]);

  return {
    details,
    isLoading,
    error,
    retry: () => void load(),
  };
}
