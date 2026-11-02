import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { MovieCard, MovieCardMovie } from '../components/MovieCard';
import { useFavorites } from '../contexts/FavoritesContext';
import { useMovieCatalog } from '../hooks/useMovieCatalog';
import { RootStackParamList } from '../navigation/RootNavigator';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const SEARCH_DEBOUNCE_MS = 450;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { user, logout } = useAuth();
  const { favorites, isFavorite } = useFavorites();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [query, setQuery] = useState('');
  const {
    movies,
    totalResults,
    hasMore,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadMoreError,
    refresh,
    retry,
    loadMore,
    retryLoadMore,
  } = useMovieCatalog(query);

  useEffect(() => {
    const normalizedSearch = searchText.trim();
    if (normalizedSearch === query) {
      return;
    }

    const timeout = setTimeout(() => {
      setQuery(normalizedSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [query, searchText]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (logoutError) {
      Alert.alert(
        'Não foi possível sair',
        logoutError instanceof Error
          ? logoutError.message
          : 'Ocorreu um erro inesperado. Tente novamente.',
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  const openMovieDetails = useCallback(
    (movie: MovieCardMovie) => {
      navigation.navigate('MovieDetails', {
        movieId: movie.id,
        title: movie.title,
      });
    },
    [navigation],
  );

  function submitSearch() {
    Keyboard.dismiss();
    setQuery(searchText.trim());
  }

  function clearSearch() {
    setSearchText('');
    setQuery('');
  }

  const listHeader = (
    <View>
      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>OLÁ, {user?.name.toUpperCase()}</Text>
          <Text style={styles.title}>Encontre seu próximo filme</Text>
          <Text style={styles.subtitle}>
            Explore o catálogo e pesquise pelo título que você procura.
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Sair da conta"
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
            <ActivityIndicator color="#F6F4EF" size="small" />
          ) : (
            <Text style={styles.logoutText}>Sair</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            accessibilityLabel="Buscar filmes"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearchText}
            onSubmitEditing={submitSearch}
            placeholder="Buscar por título..."
            placeholderTextColor="#747786"
            returnKeyType="search"
            style={styles.searchInput}
            value={searchText}
          />
          {searchText.length > 0 && (
            <Pressable
              accessibilityLabel="Limpar busca"
              accessibilityRole="button"
              hitSlop={10}
              onPress={clearSearch}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>×</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityLabel="Pesquisar"
          accessibilityRole="button"
          onPress={submitSearch}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.searchButtonText}>Buscar</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.sectionHeadingText}>
          <Text style={styles.sectionTitle}>
            {query ? `Resultados para “${query}”` : 'Filmes populares'}
          </Text>
          {!isLoading && !error && (
            <Text style={styles.resultCount}>
              {totalResults === 1
                ? '1 filme encontrado'
                : `${totalResults.toLocaleString('pt-BR')} filmes encontrados`}
            </Text>
          )}
        </View>
      </View>

      {error && movies.length > 0 && (
        <View accessibilityRole="alert" style={styles.inlineError}>
          <View style={styles.inlineErrorText}>
            <Text style={styles.inlineErrorTitle}>Falha ao atualizar</Text>
            <Text style={styles.inlineErrorMessage}>{error}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={refresh}>
            <Text style={styles.inlineRetry}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        data={movies}
        extraData={favorites}
        initialNumToRender={8}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(movie) => movie.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color="#F6C453" size="large" />
                <Text style={styles.emptyTitle}>
                  {query ? 'Buscando filmes...' : 'Carregando catálogo...'}
                </Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.emptyIcon}>!</Text>
                <Text style={styles.emptyTitle}>Não foi possível carregar</Text>
                <Text style={styles.emptyMessage}>{error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={retry}
                  style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>⌕</Text>
                <Text style={styles.emptyTitle}>Nenhum filme encontrado</Text>
                <Text style={styles.emptyMessage}>
                  Tente buscar com outro título ou revise a escrita.
                </Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          movies.length > 0 ? (
            <View style={styles.footer}>
              {isLoadingMore && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator color="#F6C453" size="small" />
                  <Text style={styles.loadingMoreText}>Carregando mais...</Text>
                </View>
              )}
              {loadMoreError && (
                <View accessibilityRole="alert" style={styles.loadMoreError}>
                  <Text style={styles.loadMoreErrorText}>{loadMoreError}</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={retryLoadMore}
                  >
                    <Text style={styles.inlineRetry}>Tentar novamente</Text>
                  </Pressable>
                </View>
              )}
              {!hasMore && !isLoadingMore && !loadMoreError && (
                <Text style={styles.endMessage}>Você chegou ao fim da lista.</Text>
              )}
              <Text style={styles.attribution}>
                This product uses the TMDB API but is not endorsed or certified
                by TMDB.
              </Text>
            </View>
          ) : undefined
        }
        ListHeaderComponent={listHeader}
        numColumns={2}
        onEndReached={loadMore}
        onEndReachedThreshold={0.45}
        onRefresh={refresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <View style={styles.cardColumn}>
            <MovieCard
              isFavorite={isFavorite(item.id)}
              movie={item}
              onPress={openMovieDetails}
            />
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
  hero: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
  },
  heroText: { flex: 1, paddingRight: 14 },
  eyebrow: {
    color: '#F6C453',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F6F4EF',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 8,
  },
  subtitle: { color: '#A9ACB9', fontSize: 14, lineHeight: 21, marginTop: 7 },
  logoutButton: {
    alignItems: 'center',
    borderColor: '#454957',
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 58,
    paddingHorizontal: 12,
  },
  logoutText: { color: '#F6F4EF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.55 },
  searchRow: { flexDirection: 'row', gap: 9, marginTop: 24 },
  searchField: {
    alignItems: 'center',
    backgroundColor: '#1A1D29',
    borderColor: '#2B2E3C',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingLeft: 13,
  },
  searchIcon: { color: '#8D91A0', fontSize: 23, marginRight: 8 },
  searchInput: { color: '#F6F4EF', flex: 1, fontSize: 14, minHeight: 48 },
  clearButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 40,
  },
  clearText: { color: '#A9ACB9', fontSize: 25, lineHeight: 27 },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#F6C453',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  searchButtonText: { color: '#171820', fontSize: 13, fontWeight: '800' },
  sectionHeading: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 27,
  },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { color: '#F6F4EF', fontSize: 19, fontWeight: '800' },
  resultCount: { color: '#858998', fontSize: 11, marginTop: 4 },
  inlineError: {
    alignItems: 'center',
    backgroundColor: '#2A1D25',
    borderColor: '#613644',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    padding: 13,
  },
  inlineErrorText: { flex: 1, paddingRight: 10 },
  inlineErrorTitle: { color: '#FFB2B2', fontSize: 13, fontWeight: '700' },
  inlineErrorMessage: { color: '#D1A7AF', fontSize: 11, lineHeight: 16, marginTop: 2 },
  inlineRetry: { color: '#F6C453', fontSize: 12, fontWeight: '800' },
  row: { gap: 14, marginBottom: 14 },
  cardColumn: { flex: 1, maxWidth: '48.5%' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    paddingHorizontal: 30,
  },
  emptyIcon: {
    color: '#F6C453',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 6,
  },
  emptyTitle: {
    color: '#F6F4EF',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  emptyMessage: {
    color: '#969AA8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F6C453',
    borderRadius: 11,
    marginTop: 18,
    paddingHorizontal: 17,
    paddingVertical: 12,
  },
  retryText: { color: '#171820', fontSize: 13, fontWeight: '800' },
  footer: { alignItems: 'center', paddingBottom: 10, paddingTop: 10 },
  loadingMore: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  loadingMoreText: { color: '#A9ACB9', fontSize: 12 },
  loadMoreError: { alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  loadMoreErrorText: {
    color: '#FFAAAA',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  endMessage: { color: '#777B8A', fontSize: 11 },
  attribution: {
    color: '#5F6371',
    fontSize: 9,
    lineHeight: 13,
    marginTop: 20,
    maxWidth: 340,
    textAlign: 'center',
  },
});
