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
