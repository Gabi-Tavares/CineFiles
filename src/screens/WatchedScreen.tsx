import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { ListStatus } from '../components/ListStatus';
import { MovieCard, MovieCardMovie } from '../components/MovieCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { MAX_RATING } from '../contexts/movieCollection';
import { useWatched } from '../contexts/WatchedContext';
import { RootStackParamList } from '../navigation/RootNavigator';

type WatchedScreenProps = NativeStackScreenProps<RootStackParamList, 'Watched'>;

function formatStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(MAX_RATING - rating);
}

export function WatchedScreen({ navigation }: WatchedScreenProps) {
  const { watched, isLoading, initializationError, retryInitialization } =
    useWatched();
  const { favorites, isFavorite } = useFavorites();
  const ratedCount = watched.filter((movie) => movie.rating !== null).length;

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
        <ListStatus isLoading title="Carregando seus filmes assistidos..." />
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
          title="Não foi possível carregar seus filmes assistidos"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        data={watched}
        extraData={favorites}
        keyExtractor={(movie) => movie.id.toString()}
        ListEmptyComponent={
          <ListStatus
            actionLabel="Explorar o catálogo"
            icon="✓"
            message="Abra um filme e toque em Assistido ou dê uma nota para ele aparecer aqui."
            onAction={() => navigation.navigate('Home')}
            title="Nenhum filme assistido ainda"
          />
        }
        ListHeaderComponent={
          watched.length > 0 ? (
            <Text style={styles.count}>
              {watched.length === 1
                ? '1 filme assistido'
                : `${watched.length} filmes assistidos`}
              {` · ${ratedCount} ${ratedCount === 1 ? 'avaliado' : 'avaliados'}`}
            </Text>
          ) : undefined
        }
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardColumn}>
            <MovieCard
              isFavorite={isFavorite(item.id)}
              movie={item}
              onPress={openMovieDetails}
            />
            <View
              accessible
              accessibilityLabel={
                item.rating === null
                  ? `${item.title}: sem nota`
                  : `${item.title}: sua nota é ${item.rating} de ${MAX_RATING}`
              }
              style={styles.ratingRow}
            >
              <Text style={styles.ratingLabel}>Sua nota</Text>
              {item.rating === null ? (
                <Text style={styles.noRating}>Sem nota</Text>
              ) : (
                <Text style={styles.stars}>{formatStars(item.rating)}</Text>
              )}
            </View>
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
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  ratingLabel: { color: '#969AA9', fontSize: 12 },
  stars: { color: '#F6C453', fontSize: 15, letterSpacing: 1 },
  noRating: { color: '#969AA9', fontSize: 12, fontStyle: 'italic' },
});
