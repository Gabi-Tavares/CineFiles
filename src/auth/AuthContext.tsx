import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type StoredAccount = AuthUser & {
  salt: string;
  passwordHash: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  initializationError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retryInitialization: () => Promise<void>;
};

const ACCOUNTS_STORAGE_KEY = '@cinefiles/accounts-v1';
const SESSION_STORAGE_KEY = '@cinefiles/session-v1';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Ocorreu um erro inesperado. Tente novamente.';
}

function parseAccounts(value: string | null): StoredAccount[] {
  if (value === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) {
    throw new Error('Os dados das contas estão inválidos neste dispositivo.');
  }

  return parsed.map((account: unknown) => {
    if (
      typeof account !== 'object' ||
      account === null ||
      !('id' in account) ||
      !('name' in account) ||
      !('email' in account) ||
      !('salt' in account) ||
      !('passwordHash' in account) ||
      typeof account.id !== 'string' ||
      typeof account.name !== 'string' ||
      typeof account.email !== 'string' ||
      typeof account.salt !== 'string' ||
      typeof account.passwordHash !== 'string'
    ) {
      throw new Error('Os dados das contas estão inválidos neste dispositivo.');
    }

    return {
      id: account.id,
      name: account.name,
      email: account.email,
      salt: account.salt,
      passwordHash: account.passwordHash,
    };
  });
}

function parseSession(value: string | null): AuthUser | null {
  if (value === null) {
    return null;
  }

  const session: unknown = JSON.parse(value);
  if (
    typeof session !== 'object' ||
    session === null ||
    !('id' in session) ||
    !('name' in session) ||
    !('email' in session) ||
    typeof session.id !== 'string' ||
    typeof session.name !== 'string' ||
    typeof session.email !== 'string'
  ) {
    throw new Error('A sessão salva está inválida neste dispositivo.');
  }

  return { id: session.id, name: session.name, email: session.email };
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateCredentials(email: string, password: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email))) {
    throw new Error('Informe um e-mail válido.');
  }
  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.');
  }
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const retryInitialization = useCallback(async () => {
    setIsLoading(true);
    setInitializationError(null);
    try {
      const storedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      setUser(parseSession(storedSession));
    } catch (error) {
      setInitializationError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void retryInitialization();
  }, [retryInitialization]);

  const login = useCallback(async (email: string, password: string) => {
    validateCredentials(email, password);
    const accounts = parseAccounts(
      await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY),
    );
    const normalizedEmail = normalizeEmail(email);
    const account = accounts.find((item) => item.email === normalizedEmail);

    if (
      !account ||
      (await hashPassword(password, account.salt)) !== account.passwordHash
    ) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const session: AuthUser = {
      id: account.id,
      name: account.name,
      email: account.email,
    };
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const cleanName = name.trim();
      if (cleanName.length < 2) {
        throw new Error('Informe seu nome (pelo menos 2 caracteres).');
      }
      validateCredentials(email, password);

      const accounts = parseAccounts(
        await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY),
      );
      const normalizedEmail = normalizeEmail(email);
      if (accounts.some((account) => account.email === normalizedEmail)) {
        throw new Error('Já existe uma conta cadastrada com este e-mail.');
      }

      const salt = Array.from(await Crypto.getRandomBytesAsync(16))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      const account: StoredAccount = {
        id: `${Date.now()}-${salt.slice(0, 8)}`,
        name: cleanName,
        email: normalizedEmail,
        salt,
        passwordHash: await hashPassword(password, salt),
      };
      await AsyncStorage.setItem(
        ACCOUNTS_STORAGE_KEY,
        JSON.stringify([...accounts, account]),
      );

      const session: AuthUser = {
        id: account.id,
        name: account.name,
        email: account.email,
      };
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      setUser(session);
    },
    [],
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      initializationError,
      login,
      register,
      logout,
      retryInitialization,
    }),
    [
      user,
      isLoading,
      initializationError,
      login,
      register,
      logout,
      retryInitialization,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
