import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../services/firebase';
import type { AuthUser } from './AuthContext';

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/email-already-in-use': 'Já existe uma conta cadastrada com este e-mail.',
  'auth/weak-password': 'A senha é fraca demais. Use pelo menos 8 caracteres.',
  'auth/network-request-failed':
    'Sem conexão com a internet. Verifique e tente novamente.',
  'auth/too-many-requests':
    'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.',
  'auth/configuration-not-found':
    'O login por e-mail não está ativado no Firebase deste projeto.',
  'auth/operation-not-allowed':
    'O login por e-mail não está ativado no Firebase deste projeto.',
};

function requireAuth() {
  if (!auth) {
    throw new Error('O Firebase não está configurado.');
  }
  return auth;
}

function translateError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    return new Error(
      FIREBASE_ERROR_MESSAGES[error.code] ??
        'Não foi possível falar com o servidor. Tente novamente.',
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}

export function toAuthUser(user: User): AuthUser {
  const email = user.email ?? '';
  return {
    id: user.uid,
    name: user.displayName || email.split('@')[0] || 'Usuário',
    email,
  };
}

export function subscribeToFirebaseUser(
  onChange: (user: AuthUser | null) => void,
  onError: (error: Error) => void,
) {
  return onAuthStateChanged(
    requireAuth(),
    (user) => onChange(user ? toAuthUser(user) : null),
    (error) => onError(translateError(error)),
  );
}

export async function firebaseLogin(
  email: string,
  password: string,
): Promise<AuthUser> {
  try {
    const credential = await signInWithEmailAndPassword(
      requireAuth(),
      email,
      password,
    );
    return toAuthUser(credential.user);
  } catch (error) {
    throw translateError(error);
  }
}

export async function firebaseRegister(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  try {
    const credential = await createUserWithEmailAndPassword(
      requireAuth(),
      email,
      password,
    );
    await updateProfile(credential.user, { displayName: name });
    return { ...toAuthUser(credential.user), name };
  } catch (error) {
    throw translateError(error);
  }
}

export async function firebaseLogout(): Promise<void> {
  try {
    await signOut(requireAuth());
  } catch (error) {
    throw translateError(error);
  }
}
