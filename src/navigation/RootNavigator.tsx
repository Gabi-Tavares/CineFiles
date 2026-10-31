import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const backgroundColor = '#10121B';

export function RootNavigator() {
  const { user, isLoading, initializationError, retryInitialization } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F6C453" />
        <Text style={styles.message}>Carregando sua sessão...</Text>
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Não foi possível carregar sua sessão</Text>
        <Text style={styles.message}>{initializationError}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void retryInitialization()}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack.Navigator
      key={user ? 'app' : 'auth'}
      screenOptions={{
        headerStyle: { backgroundColor },
        headerTintColor: '#F6F4EF',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor },
      }}
    >
      {user ? (
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'CineFiles', headerBackVisible: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={AuthScreen}
            options={{ title: 'CineFiles', headerShown: false }}
          />
          <Stack.Screen
            name="Register"
            component={AuthScreen}
            options={{ title: 'Criar conta', headerBackTitle: 'Entrar' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor,
  },
  title: {
    color: '#F6F4EF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: '#B9BBC5',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F6C453',
    borderRadius: 12,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  retryText: {
    color: '#171820',
    fontSize: 15,
    fontWeight: '700',
  },
});
