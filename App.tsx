import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { WatchedProvider } from './src/contexts/WatchedContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <WatchedProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </WatchedProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
