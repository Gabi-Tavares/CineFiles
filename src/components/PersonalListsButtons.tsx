import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFavorites } from '../contexts/FavoritesContext';
import { useWatched } from '../contexts/WatchedContext';
import { RootStackParamList } from '../navigation/RootNavigator';

function countLabel(count: number): string {
  return count === 1 ? '1 filme' : `${count} filmes`;
}

export function PersonalListsButtons() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { favorites } = useFavorites();
  const { watched } = useWatched();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityHint="Abre a lista de filmes favoritos"
        accessibilityLabel={`Meus favoritos, ${countLabel(favorites.length)}`}
        accessibilityRole="button"
        onPress={() => navigation.navigate('Favorites')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.favoriteIcon}>♥</Text>
        <Text style={styles.count}>{favorites.length}</Text>
      </Pressable>
      <Pressable
        accessibilityHint="Abre a lista de filmes assistidos"
        accessibilityLabel={`Filmes assistidos, ${countLabel(watched.length)}`}
        accessibilityRole="button"
        onPress={() => navigation.navigate('Watched')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.watchedIcon}>✓</Text>
        <Text style={styles.count}>{watched.length}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6 },
  button: {
    alignItems: 'center',
    borderColor: '#454957',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 10,
  },
  pressed: { opacity: 0.72 },
  favoriteIcon: { color: '#FF6B81', fontSize: 15 },
  watchedIcon: { color: '#F6C453', fontSize: 15, fontWeight: '800' },
  count: { color: '#F6F4EF', fontSize: 13, fontWeight: '700' },
});
