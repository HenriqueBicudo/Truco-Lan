# Deploy do Client no GitHub Pages

Siga estes passos para publicar o front-end no GitHub Pages usando `gh-pages`.

1) Atualize o `homepage` no `client/package.json`:

```
"homepage": "https://SEU_USUARIO.github.io/NOME_DO_REPO"
```

2) Crie o repositório no GitHub e adicione o remote:

```bash
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
```

3) Instale dependências (caso ainda não tenha):

```bash
cd client
npm install
```

4) Rode o deploy:

```bash
npm run deploy
```

Isso criará a pasta `dist` e publicará o conteúdo no branch `gh-pages`.

Se quiser que eu faça isso para você, me passe:
- Seu usuário GitHub
- Nome do repositório (já criado)

Aviso: se desejar automatizar a criação do repo via API, eu posso fazer — mas vou precisar de um token com permissões para isso (só realize se confiar no fluxo).