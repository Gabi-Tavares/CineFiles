# CineFiles

Aplicativo em Expo e React Native. Para instalar as dependências e iniciar o
servidor de desenvolvimento:

```sh
npm install
npx expo start
```

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
