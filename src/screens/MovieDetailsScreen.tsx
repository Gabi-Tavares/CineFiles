import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getPosterUrl } from '../api/movieApi';
import { getBackdropUrl, MovieDetails } from '../api/movieDetailsApi';
import { StarRating } from '../components/StarRating';
import { useFavorites } from '../contexts/FavoritesContext';
import { MAX_RATING, toMovieSummary } from '../contexts/movieCollection';
import { useWatched } from '../contexts/WatchedContext';
import { useMovieDetails } from '../hooks/useMovieDetails';
import { RootStackParamList } from '../navigation/RootNavigator';
import {
  cleanHtmlText,
  formatReleaseDate,
  formatRuntime,
  formatStatus,
  formatVoteAverage,
  getReleaseYear,
} from '../utils/movieText';

type MovieDetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'MovieDetails'
>;

export function MovieDetailsScreen({
  navigation,
  route,
}: MovieDetailsScreenProps) {
  const { movieId, title: initialTitle } = route.params;
  const { details, isLoading, error, retry } = useMovieDetails(movieId);

  useEffect(() => {
    navigation.setOptions({
      title: details?.title ?? initialTitle ?? 'Detalhes do filme',
    });
  }, [details?.title, initialTitle, navigation]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#F6C453" size="large" />
        <Text style={styles.centeredTitle}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredIcon}>!</Text>
        <Text style={styles.centeredTitle}>Não foi possível carregar</Text>
        <Text style={styles.centeredMessage}>
          {error ?? 'Os detalhes deste filme não estão disponíveis.'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backText}>Voltar ao catálogo</Text>
        </Pressable>
      </View>
    );
  }

  return <MovieDetailsContent details={details} />;
}

type MovieDetailsContentProps = {
  details: MovieDetails;
};

function MovieDetailsContent({ details }: MovieDetailsContentProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isWatched, getRating, toggleWatched, setRating, clearRating } =
    useWatched();

  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [isSavingWatched, setIsSavingWatched] = useState(false);
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);

  const summary = toMovieSummary(details);
  const favorite = isFavorite(details.id);
  const watched = isWatched(details.id);
  const rating = getRating(details.id);

  const posterUrl = getPosterUrl(details.poster_path, 'w342');
  const backdropUrl = getBackdropUrl(details.backdrop_path);
  const overview = cleanHtmlText(details.overview);
  const genreNames = details.genres.map((genre) => genre.name);
  const tagline = cleanHtmlText(details.tagline);
  const showOriginalTitle =
    details.original_title.trim().length > 0 &&
    details.original_title !== details.title;

  async function runAction(
    action: () => Promise<void>,
    setBusy: (busy: boolean) => void,
    failureTitle: string,
  ) {
    setBusy(true);
    try {
      await action();
    } catch (actionError) {
      Alert.alert(
        failureTitle,
        actionError instanceof Error
          ? actionError.message
          : 'Ocorreu um erro inesperado. Tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  }

  const ratingHint = watched
    ? rating === null
      ? 'Toque nas estrelas para registrar sua nota.'
      : `Você deu ${rating} de ${MAX_RATING} ${rating === 1 ? 'estrela' : 'estrelas'}.`
    : 'Ao avaliar, o filme também entra na sua lista de assistidos.';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {backdropUrl && !backdropFailed && (
        <View style={styles.backdropWrapper}>
          <Image
            accessibilityIgnoresInvertColors
            onError={() => setBackdropFailed(true)}
            resizeMode="cover"
            source={{ uri: backdropUrl }}
            style={styles.backdrop}
          />
          <View style={styles.backdropOverlay} />
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.header}>
          {posterUrl && !posterFailed ? (
            <Image
              accessibilityIgnoresInvertColors
              accessibilityLabel={`Pôster de ${details.title}`}
              onError={() => setPosterFailed(true)}
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

          <View style={styles.headerText}>
            <Text style={styles.title}>{details.title}</Text>
            {showOriginalTitle && (
              <Text style={styles.originalTitle}>
                Título original: {details.original_title}
              </Text>
            )}
            {tagline.length > 0 && <Text style={styles.tagline}>“{tagline}”</Text>}

            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {getReleaseYear(details.release_date)}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {formatRuntime(details.runtime)}
                </Text>
              </View>
              <View style={[styles.chip, styles.ratingChip]}>
                <Text style={styles.ratingChipText}>
                  ★ {formatVoteAverage(details.vote_average, details.vote_count)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {genreNames.length > 0 && (
          <View style={styles.genreRow}>
            {genreNames.map((genre) => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            accessibilityHint={
              favorite
                ? 'Remove o filme da sua lista de favoritos'
                : 'Adiciona o filme à sua lista de favoritos'
            }
            accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Favoritar'}
            accessibilityRole="button"
            accessibilityState={{ selected: favorite, disabled: isSavingFavorite }}
            disabled={isSavingFavorite}
            onPress={() =>
              void runAction(
                () => toggleFavorite(summary),
                setIsSavingFavorite,
                'Não foi possível atualizar seus favoritos',
              )
            }
            style={({ pressed }) => [
              styles.actionButton,
              favorite && styles.actionButtonActive,
              pressed && styles.pressed,
              isSavingFavorite && styles.disabled,
            ]}
          >
            {isSavingFavorite ? (
              <ActivityIndicator color="#F6F4EF" size="small" />
            ) : (
              <Text
                style={[
                  styles.actionText,
                  favorite && styles.actionTextActive,
                ]}
              >
                {favorite ? '♥  Favorito' : '♡  Favoritar'}
              </Text>
            )}
          </Pressable>

          <Pressable
            accessibilityHint={
              watched
                ? 'Remove o filme da sua lista de assistidos e descarta a nota'
                : 'Adiciona o filme à sua lista de assistidos'
            }
            accessibilityLabel={
              watched ? 'Desmarcar como assistido' : 'Marcar como assistido'
            }
            accessibilityRole="button"
            accessibilityState={{ selected: watched, disabled: isSavingWatched }}
            disabled={isSavingWatched}
            onPress={() =>
              void runAction(
                () => toggleWatched(summary),
                setIsSavingWatched,
                'Não foi possível atualizar seus filmes assistidos',
              )
            }
            style={({ pressed }) => [
              styles.actionButton,
              watched && styles.actionButtonActive,
              pressed && styles.pressed,
              isSavingWatched && styles.disabled,
            ]}
          >
            {isSavingWatched ? (
              <ActivityIndicator color="#F6F4EF" size="small" />
            ) : (
              <Text
                style={[styles.actionText, watched && styles.actionTextActive]}
              >
                {watched ? '✓  Assistido' : '+  Assistido'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sua avaliação</Text>
            {rating !== null && (
              <Pressable
                accessibilityLabel="Remover minha avaliação"
                accessibilityRole="button"
                disabled={isSavingRating}
                hitSlop={8}
                onPress={() =>
                  void runAction(
                    () => clearRating(details.id),
                    setIsSavingRating,
                    'Não foi possível remover sua avaliação',
                  )
                }
              >
                <Text style={styles.clearRatingText}>Remover nota</Text>
              </Pressable>
            )}
          </View>

          <StarRating
            disabled={isSavingRating}
            onChange={(nextRating) =>
              void runAction(
                () => setRating(summary, nextRating),
                setIsSavingRating,
                'Não foi possível salvar sua avaliação',
              )
            }
            value={rating}
          />
          <Text style={styles.cardHint}>{ratingHint}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={overview ? styles.overview : styles.overviewEmpty}>
            {overview || 'Este filme ainda não tem sinopse em português.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <InfoRow
            label="Lançamento"
            value={formatReleaseDate(details.release_date)}
          />
          <InfoRow label="Duração" value={formatRuntime(details.runtime)} />
          <InfoRow
            label="Gêneros"
            value={genreNames.length > 0 ? genreNames.join(', ') : 'Não informados'}
          />
          <InfoRow label="Situação" value={formatStatus(details.status)} />
          <InfoRow
            label="Votos na TMDB"
            value={
              details.vote_count > 0
                ? details.vote_count.toLocaleString('pt-BR')
                : 'Nenhum voto'
            }
          />
        </View>

        <Text style={styles.attribution}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
      </View>
    </ScrollView>
  );
}

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#10121B', flex: 1 },
  scrollContent: { paddingBottom: 34 },
  centered: {
    alignItems: 'center',
    backgroundColor: '#10121B',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  centeredIcon: {
    color: '#F6C453',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  centeredTitle: {
    color: '#F6F4EF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  centeredMessage: {
    color: '#969AA8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F6C453',
    borderRadius: 11,
    marginTop: 20,
    paddingHorizontal: 17,
    paddingVertical: 12,
  },
  retryText: { color: '#171820', fontSize: 13, fontWeight: '800' },
  backButton: { marginTop: 14, padding: 8 },
  backText: { color: '#A9ACB9', fontSize: 13, fontWeight: '600' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  backdropWrapper: { height: 186, width: '100%' },
  backdrop: { height: '100%', width: '100%' },
  backdropOverlay: {
    backgroundColor: 'rgba(16, 18, 27, 0.55)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  body: {
    alignSelf: 'center',
    maxWidth: 760,
    paddingHorizontal: 18,
    width: '100%',
  },
  header: { flexDirection: 'row', marginTop: 20 },
  poster: {
    backgroundColor: '#252938',
    borderColor: '#292D3B',
    borderRadius: 12,
    borderWidth: 1,
    height: 186,
    width: 124,
  },
  posterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
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
  headerText: { flex: 1, paddingLeft: 15 },
  title: {
    color: '#F6F4EF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  originalTitle: { color: '#8D91A0', fontSize: 12, lineHeight: 17, marginTop: 6 },
  tagline: {
    color: '#C3B592',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  chip: {
    backgroundColor: '#1A1D29',
    borderColor: '#2B2E3C',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  chipText: { color: '#B9BBC5', fontSize: 11, fontWeight: '600' },
  ratingChip: { borderColor: '#4A3F22' },
  ratingChipText: { color: '#F6C453', fontSize: 11, fontWeight: '800' },
  genreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  genreChip: {
    backgroundColor: '#20242F',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  genreText: { color: '#D2D4DD', fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  actionButton: {
    alignItems: 'center',
    borderColor: '#454957',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 12,
  },
  actionButtonActive: { backgroundColor: '#2A2416', borderColor: '#F6C453' },
  actionText: { color: '#F6F4EF', fontSize: 13, fontWeight: '700' },
  actionTextActive: { color: '#F6C453' },
  card: {
    backgroundColor: '#1A1D29',
    borderColor: '#292D3B',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: { color: '#F6F4EF', fontSize: 15, fontWeight: '800' },
  clearRatingText: { color: '#F6C453', fontSize: 12, fontWeight: '700' },
  cardHint: { color: '#8D91A0', fontSize: 12, lineHeight: 17, marginTop: 11 },
  section: { marginTop: 26 },
  sectionTitle: {
    color: '#F6F4EF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 11,
  },
  overview: { color: '#C6C9D3', fontSize: 14, lineHeight: 22 },
  overviewEmpty: {
    color: '#80848F',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  infoRow: {
    borderTopColor: '#22252F',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 11,
  },
  infoLabel: { color: '#858998', fontSize: 13, width: 128 },
  infoValue: { color: '#E2E4EB', flex: 1, fontSize: 13, lineHeight: 19 },
  attribution: {
    alignSelf: 'center',
    color: '#5F6371',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 28,
    maxWidth: 340,
    textAlign: 'center',
  },
});
