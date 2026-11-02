import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadCloudList, saveCloudList } from '../services/cloudLists';

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

function warnCloudFailure(error: unknown) {
  console.warn('Falha ao sincronizar com a nuvem:', getErrorMessage(error));
}

async function loadList<T>(
  storageKey: string,
  cloudPath: string | null,
  parse: (value: string | null) => T[],
): Promise<T[]> {
  const updatedAtKey = `${storageKey}:updatedAt`;
  const [stored, localUpdatedAt] = await Promise.all([
    AsyncStorage.getItem(storageKey),
    AsyncStorage.getItem(updatedAtKey),
  ]);
  const localItems = parse(stored);

  if (cloudPath === null) {
    return localItems;
  }

  try {
    const cloud = await loadCloudList(cloudPath);

    if (cloud && (localUpdatedAt === null || cloud.updatedAt >= localUpdatedAt)) {
      const cloudItems = parse(JSON.stringify(cloud.items));
      await AsyncStorage.multiSet([
        [storageKey, JSON.stringify(cloudItems)],
        [updatedAtKey, cloud.updatedAt],
      ]);
      return cloudItems;
    }

    if (stored !== null) {
      await saveCloudList(
        cloudPath,
        localItems,
        localUpdatedAt ?? new Date().toISOString(),
      );
    }
  } catch (error) {
    warnCloudFailure(error);
  }

  return localItems;
}

export function usePersistentList<T>(
  storageKey: string | null,
  cloudPath: string | null,
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
    loadList(storageKey, cloudPath, parse)
      .then((items) => {
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
  }, [storageKey, cloudPath, parse, attempt]);

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
        const updatedAt = new Date().toISOString();
        await AsyncStorage.multiSet([
          [storageKey, JSON.stringify(next)],
          [`${storageKey}:updatedAt`, updatedAt],
        ]);

        if (readyKeyRef.current !== storageKey) {
          return;
        }
        itemsRef.current = next;
        setState({ key: storageKey, items: next, error: null });

        if (cloudPath !== null) {
          saveCloudList(cloudPath, next, updatedAt).catch(warnCloudFailure);
        }
      });

      queueRef.current = task.catch(() => undefined);
      return task;
    },
    [storageKey, cloudPath],
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
