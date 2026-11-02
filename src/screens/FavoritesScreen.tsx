import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ListStatus } from '../components/ListStatus';
import { MovieCard, MovieCardMovie } from '../components/MovieCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type FavoritesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Favorites'
>;

export function FavoritesScreen({ navigation }: FavoritesScreenProps) {
  const { favorites, isLoading, initializationError, retryInitialization } =
    useFavorites();

  const openMovieDetails = useCallback(
    (movie: MovieCardMovie) => {
      navigation.navigate('MovieDetails', {
        movieId: movie.id,
        title: movie.title,
      });
    },
    [navigation],
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ListStatus isLoading title="Carregando seus favoritos..." />
      </View>
    );
  }

  if (initializationError) {
    return (
      <View style={styles.container}>
        <ListStatus
          actionLabel="Tentar novamente"
          icon="!"
          message={initializationError}
          onAction={retryInitialization}
          title="Não foi possível carregar seus favoritos"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        data={favorites}
        keyExtractor={(movie) => movie.id.toString()}
        ListEmptyComponent={
          <ListStatus
            actionLabel="Explorar o catálogo"
            icon="♡"
            message="Abra um filme e toque em Favoritar para guardá-lo aqui."
            onAction={() => navigation.popTo('Home')}
            title="Você ainda não tem favoritos"
          />
        }
        ListHeaderComponent={
          favorites.length > 0 ? (
            <Text style={styles.count}>
              {favorites.length === 1
                ? '1 filme favorito'
                : `${favorites.length} filmes favoritos`}
            </Text>
          ) : undefined
        }
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardColumn}>
            <MovieCard isFavorite movie={item} onPress={openMovieDetails} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#10121B', flex: 1 },
  listContent: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 760,
    paddingBottom: 28,
    paddingHorizontal: 18,
    width: '100%',
  },
  count: {
    color: '#A9ACB9',
    fontSize: 13,
    marginBottom: 14,
    marginTop: 18,
  },
  row: { gap: 14, marginBottom: 14 },
  cardColumn: { flex: 1, maxWidth: '48.5%' },
});
