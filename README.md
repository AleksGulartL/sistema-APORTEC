# APORTEC

## Iniciar o projeto

1. Tenha Node.js e Homebrew instalados. No macOS, instale o [Yarn Classic](https://classic.yarnpkg.com/en/docs/install) e o [PostgreSQL 17](https://formulae.brew.sh/formula/postgresql@17), e inicie o banco:

   ```bash
   npm install --global yarn@1.22.22
   brew install postgresql@17
   brew services start postgresql@17
   ```

   Para disponibilizar o comando `psql`, adicione esta linha ao arquivo `~/.zprofile`:

   ```bash
   export PATH="$(brew --prefix postgresql@17)/bin:$PATH"
   ```

   Recarregue a configuração com `source ~/.zprofile`. Comece os próximos passos na pasta raiz do projeto, onde ficam `client` e `server`.

2. Instale as dependências:

   ```bash
   cd server
   yarn install
   cd ../client
   yarn install
   cd ..
   ```

3. Na primeira execução, crie o banco e importe os dados de `server/aportec.sql`. Se já tem o banco com dados, pule esta etapa e use as migrações após configurar o `.env` no passo 4:

   ```bash
   psql -h localhost -p 5432 -U "$(whoami)" -d postgres -c "CREATE DATABASE aportec;"
   psql -h localhost -p 5432 -U "$(whoami)" -d aportec -X -1 -v ON_ERROR_STOP=1 -f server/aportec.sql
   ```

   Na instalação local pelo Homebrew, o usuário inicial do PostgreSQL tem o mesmo nome do usuário do macOS, obtido por `whoami`; o usuário `postgres` não é criado automaticamente. Se o banco `aportec` já existir, pule o comando de criação. A importação apaga e recria as tabelas do projeto; execute apenas no banco local de desenvolvimento.

4. Se ainda não existir `server/.env`, copie o arquivo de exemplo:

   ```bash
   cp server/.env.example server/.env
   ```

   Configure `server/.env` com os dados do seu PostgreSQL:

   ```dotenv
   DOTENV_CONFIG_QUIET=true
   PORT=3000
   DB_NAME=aportec
   DB_USER=seu_usuario_do_mac
   DB_PASS=
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=aportec_segredo_super_secreto_jwt_2026
   JWT_EXPIRES_IN=1h
   ```

   Substitua `DB_USER` pelo resultado de `whoami` (`bruno` nesta máquina). Na instalação padrão local pelo Homebrew, `DB_PASS` pode ficar vazio. Se você configurou uma senha para o banco, preencha esse campo. Essas credenciais são do banco, diferentes das contas de acesso ao app.

5. Em um terminal na raiz do projeto, inicie o backend e mantenha-o aberto:

   ```bash
   cd server
   yarn run dev
   ```

   A API será executada em [http://localhost:3000](http://localhost:3000).

6. Em outro terminal na raiz do projeto, inicie o frontend e mantenha-o aberto:

   ```bash
   cd client
   yarn run dev
   ```

7. Abra [http://localhost:5173](http://localhost:5173) no navegador.

## Testar o login

1. Na tela de login, preencha **E-mail** com `admin@gmail.com` e **Senha** com `senha123`.
2. Clique em **Entrar**.
3. Confira se o **Dashboard** foi aberto e se a barra superior mostra **Ana Administradora (ADM)**.
4. Para entrar com outra conta, clique em **Sair** e repita o login com um dos usuários cadastrados em `server/aportec.sql`:

   | Perfil | E-mail | Senha | Tela após o login |
   | --- | --- | --- | --- |
   | Administrador | `admin@gmail.com` | `senha123` | Dashboard |
   | Administrador | `alekslopes7@gmail.com` | `senha123` | Dashboard |
   | Técnico | `tecnico@gmail.com` | `senha123` | Dashboard |
   | Cliente | `clara@gmail.com` | `senha123` | Portal do cliente, na aba Início |
