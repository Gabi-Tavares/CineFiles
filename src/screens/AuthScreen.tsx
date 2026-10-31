import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type AuthScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login' | 'Register'
>;

const isEmailValid = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export function AuthScreen({ navigation, route }: AuthScreenProps) {
  const isRegister = route.name === 'Register';
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (isRegister && name.trim().length < 2) {
      setError('Informe seu nome (pelo menos 2 caracteres).');
      return;
    }
    if (!isEmailValid(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Não foi possível concluir a operação. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.brandMark}>
            <Text style={styles.brandIcon}>CF</Text>
          </View>
          <Text style={styles.eyebrow}>SEU PRÓXIMO FILME FAVORITO</Text>
          <Text style={styles.title}>
            {isRegister ? 'Crie sua conta' : 'Entre no seu universo'}
          </Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Organize seus filmes favoritos em um só lugar.'
              : 'Descubra, salve e acompanhe os filmes que você ama.'}
          </Text>

          {isRegister && (
            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                accessibilityLabel="Nome"
                autoCapitalize="words"
                autoComplete="name"
                onChangeText={setName}
                placeholder="Como podemos te chamar?"
                placeholderTextColor="#747786"
                returnKeyType="next"
                style={styles.input}
                value={name}
              />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setError(null);
              }}
              placeholder="voce@email.com"
              placeholderTextColor="#747786"
              returnKeyType="next"
              style={styles.input}
              textContentType="emailAddress"
              value={email}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              autoCapitalize="none"
              autoComplete={isRegister ? 'new-password' : 'password'}
              onChangeText={(value) => {
                setPassword(value);
                setError(null);
              }}
              onSubmitEditing={() => void handleSubmit()}
              placeholder="Pelo menos 8 caracteres"
              placeholderTextColor="#747786"
              returnKeyType="done"
              secureTextEntry
              style={styles.input}
              textContentType={isRegister ? 'newPassword' : 'password'}
              value={password}
            />
          </View>

          {error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !isSubmitting && styles.pressed,
              isSubmitting && styles.disabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#171820" />
            ) : (
              <Text style={styles.submitText}>
                {isRegister ? 'Criar conta' : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                setError(null);
                navigation.navigate(isRegister ? 'Login' : 'Register');
              }}
            >
              <Text style={styles.switchLink}>
                {isRegister ? 'Entrar' : 'Cadastre-se'}
              </Text>
            </Pressable>
          </View>
          <Text style={styles.demoNote}>
            Conta de demonstração salva somente neste dispositivo.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: '#10121B' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 32,
  },
  content: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brandMark: {
    alignItems: 'center',
    backgroundColor: '#F6C453',
    borderRadius: 16,
    height: 54,
    justifyContent: 'center',
    marginBottom: 28,
    width: 54,
  },
  brandIcon: { color: '#171820', fontSize: 19, fontWeight: '900' },
  eyebrow: {
    color: '#F6C453',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#F6F4EF',
    fontSize: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 10,
  },
  subtitle: {
    color: '#B9BBC5',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 30,
    marginTop: 9,
  },
  field: { marginBottom: 18 },
  label: {
    color: '#E8E7E2',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1D29',
    borderColor: '#2A2D3B',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F6F4EF',
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  error: {
    color: '#FF8D8D',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#F6C453',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 5,
  },
  submitText: { color: '#171820', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  switchText: { color: '#B9BBC5', fontSize: 13 },
  switchLink: { color: '#F6C453', fontSize: 13, fontWeight: '700', marginLeft: 5 },
  demoNote: {
    color: '#777B8B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 24,
    textAlign: 'center',
  },
});
