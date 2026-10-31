import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen(_props: HomeScreenProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert(
        'Não foi possível sair',
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado. Tente novamente.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.eyebrow}>BEM-VINDA AO CINEFILES</Text>
        <Text style={styles.title}>Olá, {user?.name}!</Text>
        <Text style={styles.subtitle}>
          Sua conta está conectada. O catálogo de filmes será integrado aqui.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isLoggingOut}
        onPress={() => void handleLogout()}
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.pressed,
          isLoggingOut && styles.disabled,
        ]}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#F6F4EF" />
        ) : (
          <Text style={styles.logoutText}>Sair da conta</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10121B',
    flex: 1,
    justifyContent: 'space-between',
    padding: 26,
  },
  eyebrow: {
    color: '#F6C453',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: { color: '#F6F4EF', fontSize: 30, fontWeight: '800', marginTop: 12 },
  subtitle: { color: '#B9BBC5', fontSize: 15, lineHeight: 23, marginTop: 10 },
  logoutButton: {
    alignItems: 'center',
    borderColor: '#494D5A',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  logoutText: { color: '#F6F4EF', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.6 },
});
