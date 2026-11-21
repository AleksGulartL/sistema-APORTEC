# APORTEC — Sistema de Gestão Operacional e Produtiva

Aplicação web full stack para gestão de orçamentos, pedidos, estoque, medições técnicas em obra, ordens de serviço, prontuário de portas instaladas e portal do cliente.

## Tecnologias

- **Backend (`server/`):** Node.js, Express 5, Sequelize, PostgreSQL (`pg`), JWT e bcrypt.
- **Frontend (`client/`):** React 18, Vite 6, Material UI v6 e Axios.

## Pré-requisitos

Tenha instalados e em execução na sua máquina (Linux, Windows ou macOS):

- **Node.js** (versão LTS recomendada)
- **[Yarn](https://classic.yarnpkg.com/en/docs/install)**
- **PostgreSQL** (com o serviço em execução e `psql` disponível no terminal ou via ferramenta gráfica como pgAdmin/DBeaver)

## Iniciar o projeto

Comece na pasta raiz do projeto, onde ficam `client` e `server`.

1. **Instale as dependências:**

   ```bash
   cd server
   yarn install
   cd ../client
   yarn install
   cd ..
   ```

2. **Crie o banco de dados `aportec` e importe `server/aportec.sql`:**

   Substitua `seu_usuario_postgres` pelo usuário configurado no seu PostgreSQL (por exemplo, `postgres`):

   ```bash
   psql -h localhost -p 5432 -U seu_usuario_postgres -d postgres -c "CREATE DATABASE aportec;"
   psql -h localhost -p 5432 -U seu_usuario_postgres -d aportec -X -1 -v ON_ERROR_STOP=1 -f server/aportec.sql
   ```

   *(Se o banco `aportec` já existir, pule o primeiro comando. Você também pode criar o banco e executar o conteúdo de `server/aportec.sql` diretamente pelo pgAdmin ou DBeaver. Atenção: o script apaga e recria todas as tabelas com os dados iniciais de demonstração.)*

3. **Configure as variáveis de ambiente do backend (`server/.env`):**

   Crie o arquivo `server/.env` a partir de `server/.env.example`:

   ```bash
   cp server/.env.example server/.env
   ```
   *(No Windows PowerShell/CMD, copie o arquivo manualmente ou use `copy server\.env.example server\.env`.)*

   Preencha `server/.env` com as credenciais do seu PostgreSQL:

   ```dotenv
   DOTENV_CONFIG_QUIET=true
   PORT=3000
   DB_NAME=aportec
   DB_USER=seu_usuario_postgres
   DB_PASS=sua_senha_postgres
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=aportec_segredo_super_secreto_jwt_2026
   JWT_EXPIRES_IN=1h
   ```

4. **Em um terminal, inicie o backend:**

   ```bash
   cd server
   yarn dev
   ```

   A API será executada em [http://localhost:3000](http://localhost:3000).

5. **Em outro terminal, inicie o frontend:**

   ```bash
   cd client
   yarn dev
   ```

6. Abra **[http://localhost:5173](http://localhost:5173)** no navegador.

## Testar o login

1. Na tela de login, preencha **E-mail** com `admin@aportec.com` e **Senha** com `senha123`.
2. Clique em **Entrar**.
3. Confira se o **Dashboard** foi aberto e se a barra superior mostra **Ana Administradora (ADM)**.
4. Para testar outros perfis, clique em **Sair** e entre com uma das contas iniciais cadastradas em `server/aportec.sql`:

   | Perfil | E-mail | Senha | Tela após o login |
   | --- | --- | --- | --- |
   | Administrador | `admin@aportec.com` | `senha123` | Dashboard |
   | Técnico | `tecnico@aportec.com` | `senha123` | Dashboard |
   | Cliente | `clara@aportec.com` | `senha123` | Portal do cliente, na aba Início |
