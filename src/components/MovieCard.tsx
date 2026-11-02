import { memo, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getPosterUrl, Movie } from '../api/movieApi';

export type MovieCardMovie = Pick<
  Movie,
  'id' | 'title' | 'poster_path' | 'release_date' | 'vote_average' | 'vote_count'
>;

type MovieCardProps = {
  movie: MovieCardMovie;
  isFavorite?: boolean;
  onPress?: (movie: MovieCardMovie) => void;
};

function MovieCardComponent({
  movie,
  isFavorite = false,
  onPress,
}: MovieCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const posterUrl = getPosterUrl(movie.poster_path);
  const releaseYear = movie.release_date?.slice(0, 4) || 'Sem data';
  const rating =
    movie.vote_count > 0
      ? movie.vote_average.toFixed(1).replace('.', ',')
      : 'Sem nota';

  useEffect(() => {
    setImageFailed(false);
  }, [posterUrl]);

  const content = (
    <>
      {posterUrl && !imageFailed ? (
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: posterUrl }}
          style={styles.poster}
        />
      ) : (
        <View style={[styles.poster, styles.posterPlaceholder]}>
          <Text style={styles.placeholderIcon}>CF</Text>
          <Text style={styles.placeholderText}>Pôster indisponível</Text>
        </View>
      )}

      {isFavorite && (
        <View style={styles.favoriteBadge}>
          <Text style={styles.favoriteIcon}>♥</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {movie.title}
        </Text>
        <View style={styles.metadata}>
          <Text style={styles.year}>{releaseYear}</Text>
          <Text style={styles.rating}>★ {rating}</Text>
        </View>
      </View>
    </>
  );

  const accessibilityLabel = `${movie.title}, ${releaseYear}, nota ${rating}${
    isFavorite ? ', favorito' : ''
  }`;

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={accessibilityLabel} style={styles.card}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityHint="Abre os detalhes do filme"
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={() => onPress(movie)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

export const MovieCard = memo(MovieCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1D29',
    borderColor: '#292D3B',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  poster: { aspectRatio: 2 / 3, backgroundColor: '#252938', width: '100%' },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeholderIcon: {
    color: '#F6C453',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -1,
  },
  placeholderText: {
    color: '#848897',
    fontSize: 11,
    marginTop: 7,
    textAlign: 'center',
  },
  favoriteBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(16, 18, 27, 0.82)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
  },
  favoriteIcon: { color: '#FF6B81', fontSize: 16, lineHeight: 19 },
  content: { minHeight: 86, padding: 11 },
  title: { color: '#F6F4EF', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  year: { color: '#969AA9', fontSize: 12 },
  rating: { color: '#F6C453', fontSize: 12, fontWeight: '700' },
});
