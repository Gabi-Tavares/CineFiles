# CineFiles

Aplicativo acadêmico de catálogo de filmes feito com Expo, React Native e
TypeScript. O catálogo usa a API da [TMDB](https://www.themoviedb.org/).

## Como executar

Pré-requisitos: Node.js 22.13 ou superior, npm, Expo Go e uma credencial de
desenvolvedor da TMDB.

```sh
npm install
cp .env.example .env.local
```

Edite o `.env.local` e informe o **API Read Access Token**:

```env
EXPO_PUBLIC_TMDB_ACCESS_TOKEN=seu_token_aqui
```

Também é possível usar `EXPO_PUBLIC_TMDB_API_KEY` com a chave v3. Depois,
inicie o projeto:

```sh
npx expo start --clear
```

O Expo incorpora variáveis `EXPO_PUBLIC_*` no aplicativo. Portanto, uma
credencial usada no cliente não deve ser tratada como segredo. Em um produto
real, use um backend intermediário para proteger credenciais sensíveis.

## Catálogo de filmes

A parte do catálogo está organizada desta forma:

- `src/api/movieApi.ts`: instância do Axios, autenticação, tipos, imagens e
  mensagens de erro;
- `src/hooks/useMovieCatalog.ts`: carregamento, cancelamento de requisições,
  paginação, atualização e tratamento de erros;
- `src/components/MovieCard.tsx`: card reutilizável com pôster, título, ano e
  nota;
- `src/screens/HomeScreen.tsx`: grade com `FlatList`, busca com debounce,
  rolagem infinita, pull-to-refresh e estados visuais.

O catálogo usa `/movie/popular` quando a busca está vazia e `/search/movie`
quando há texto. Os resultados são solicitados em português do Brasil.

## Detalhes e avaliação pessoal

Ao tocar em um card do catálogo, o aplicativo navega para `MovieDetails` e
busca o filme individualmente em `GET /movie/{id}`:

- `src/api/movieDetailsApi.ts`: tipo `MovieDetails`, `fetchMovieDetails`,
  `getBackdropUrl` e mensagens de erro (inclui o 404 de filme inexistente).
  Reaproveita a instância do Axios exportada por `movieApi.ts`;
- `src/hooks/useMovieDetails.ts`: requisição por ID com cancelamento via
  `AbortController`, estados de carregamento, erro e nova tentativa;
- `src/utils/movieText.ts`: limpeza de HTML da sinopse (tags e entidades),
  duração em `2h 19min`, data em português e tradução da situação do filme;
- `src/components/StarRating.tsx`: avaliação de 1 a 5 estrelas, acessível
  como `radiogroup`;
- `src/screens/MovieDetailsScreen.tsx`: pôster, fundo, título, slogan,
  gêneros, duração, lançamento, sinopse e os botões de favoritar, marcar como
  assistido e avaliar.

A sinopse da TMDB chega em texto simples, sem HTML. A limpeza de
`cleanHtmlText` é uma proteção: alguns títulos trazem sobras de marcação
(`<br>`, `&amp;`, espaços duplicados) vindas de fontes externas.

### Contratos dos Contexts

Os botões não guardam estado próprio: eles consomem `useFavorites()` e
`useWatched()`. Os tipos compartilhados ficam em
`src/contexts/movieCollection.ts` (`MovieSummary`, `FavoriteMovie`,
`WatchedMovie`, faixa de notas).

| Hook | API pública |
| --- | --- |
| `useFavorites()` | `favorites`, `isFavorite`, `toggleFavorite`, `removeFavorite` |
| `useWatched()` | `watched`, `isWatched`, `getRating`, `toggleWatched`, `setRating`, `clearRating` |

Os dois hooks também expõem `isLoading`, `initializationError` e
`retryInitialization`.

Regras já embutidas: avaliar um filme também o marca como assistido, e
desmarcar como assistido descarta a nota.

## Favoritos, assistidos e persistência

- `src/hooks/usePersistentList.ts`: hook que guarda uma lista no AsyncStorage.
  Lê a lista salva em um `useEffect` quando o usuário entra, informa
  `isLoading` enquanto lê e grava cada alteração antes de atualizar a tela.
  As gravações entram em fila, então dois toques seguidos não se sobrescrevem;
- `src/contexts/FavoritesContext.tsx` e `src/contexts/WatchedContext.tsx`:
  usam o hook acima e validam o JSON lido (itens inválidos são descartados, e
  notas fora de 1 a 5 viram "sem nota");
- `src/screens/FavoritesScreen.tsx` e `src/screens/WatchedScreen.tsx`: grades
  com o `MovieCard`, estado de carregamento, erro com "Tentar novamente" e
  estado vazio (`ListEmptyComponent`). Os assistidos mostram a nota pessoal;
- `src/components/PersonalListsButtons.tsx`: botões ♥ e ✓ no cabeçalho do
  catálogo, com a quantidade de filmes de cada lista;
- `src/components/ListStatus.tsx`: mensagem central usada nos estados de
  carregamento, erro e lista vazia.

As listas são salvas por usuário (`@cinefiles/favorites-v1:<id>` e
`@cinefiles/watched-v1:<id>`). Ao sair da conta, elas somem da tela; ao entrar
de novo, voltam. Como todas as telas leem o mesmo Context, favoritar, marcar
como assistido ou dar nota em uma tela muda as outras na hora, incluindo o ♥
nos cards do catálogo.

## Autenticação de demonstração

O cadastro e o login desta versão são locais: as contas são salvas no
AsyncStorage do dispositivo e a sessão permanece ativa ao reabrir o aplicativo.
As senhas não são armazenadas em texto simples. Esse fluxo é apenas para
demonstração acadêmica; não substitui autenticação em um servidor e as contas
não são compartilhadas entre dispositivos.

O `AuthProvider` fornece `user`, `login`, `register` e `logout` por meio do hook
`useAuth`. A navegação alterna automaticamente entre as telas de autenticação e
o aplicativo conforme a sessão. A tela inicial autenticada é um ponto de
integração para o catálogo.

This product uses the TMDB API but is not endorsed or certified by TMDB.
