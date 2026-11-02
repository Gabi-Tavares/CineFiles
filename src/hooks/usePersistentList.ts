import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

type PersistentListState<T> = {
  key: string | null;
  items: T[];
  error: string | null;
};

const NOT_READY_MESSAGE =
  'Suas listas ainda estão carregando. Tente novamente em instantes.';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível ler os dados salvos neste dispositivo.';
}

export function usePersistentList<T>(
  storageKey: string | null,
  parse: (value: string | null) => T[],
) {
  const [state, setState] = useState<PersistentListState<T>>({
    key: null,
    items: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const itemsRef = useRef<T[]>([]);
  const readyKeyRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    readyKeyRef.current = null;
    itemsRef.current = [];

    if (storageKey === null) {
      setState({ key: null, items: [], error: null });
      return;
    }

    let active = true;
    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        const items = parse(stored);
        if (!active) {
          return;
        }
        itemsRef.current = items;
        readyKeyRef.current = storageKey;
        setState({ key: storageKey, items, error: null });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        setState({ key: storageKey, items: [], error: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, [storageKey, parse, attempt]);

  const retryInitialization = useCallback(() => {
    setState({ key: null, items: [], error: null });
    setAttempt((current) => current + 1);
  }, []);

  const update = useCallback(
    (updater: (current: T[]) => T[]) => {
      const task = queueRef.current.then(async () => {
        if (storageKey === null || readyKeyRef.current !== storageKey) {
          throw new Error(NOT_READY_MESSAGE);
        }

        const next = updater(itemsRef.current);
        await AsyncStorage.setItem(storageKey, JSON.stringify(next));

        if (readyKeyRef.current !== storageKey) {
          return;
        }
        itemsRef.current = next;
        setState({ key: storageKey, items: next, error: null });
      });

      queueRef.current = task.catch(() => undefined);
      return task;
    },
    [storageKey],
  );

  const isCurrent = state.key === storageKey;

  return {
    items: isCurrent ? state.items : [],
    isLoading: storageKey !== null && !isCurrent,
    initializationError: isCurrent ? state.error : null,
    retryInitialization,
    update,
  };
}
