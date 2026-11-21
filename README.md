# APORTEC — Sistema de Gestão Operacional e Produtiva

Aplicação web full stack para gestão de orçamentos, pedidos, estoque, medições técnicas em obra, ordens de serviço, prontuário de portas instaladas e portal do cliente.

## Tecnologias

- **Backend (`server/`):** Node.js, Express 5, Sequelize, PostgreSQL (`pg`), JWT e bcrypt.
- **Frontend (`client/`):** React 18, Vite 6, Material UI v6 e Axios.

## Pré-requisitos

Tenha instalados na sua máquina (Linux, Windows ou macOS):

- **Node.js** (versão LTS recomendada)
- **[Yarn](https://classic.yarnpkg.com/en/docs/install)**
- **PostgreSQL** (com o serviço em execução e `psql` disponível no terminal ou via ferramenta gráfica como pgAdmin/DBeaver)

O sistema depende de três processos: PostgreSQL (banco, porta padrão `5432`), backend (API, porta `3000`) e frontend (interface, porta `5173`). Os comandos `yarn dev` iniciam apenas o backend e o frontend; eles não instalam nem iniciam o PostgreSQL.

## Iniciar o PostgreSQL

Antes de preparar o banco ou iniciar a aplicação, confira se o serviço PostgreSQL está em execução no computador que será usado:

| Sistema / instalação | Como iniciar o serviço já instalado |
| --- | --- |
| macOS com Homebrew e PostgreSQL 17 | Execute `brew services start postgresql@17`. Se instalou outra versão, ajuste o nome da fórmula. |
| Windows com PostgreSQL instalado como serviço | Pressione `Win + R`, abra `services.msc`, localize o serviço PostgreSQL e clique em **Iniciar**. O nome do serviço depende da instalação. |
| Linux com systemd e serviço chamado `postgresql` | Execute `sudo systemctl start postgresql`. O nome do serviço pode variar conforme a distribuição e a instalação. |

No macOS, o comando `brew services start` também registra a inicialização automática ao entrar na conta do usuário. Essa configuração pertence àquele computador e usuário: ela não é salva no repositório nem transferida ao clonar o projeto. Veja a [documentação do Homebrew](https://docs.brew.sh/Manpage#services-subcommand).

Se as ferramentas do PostgreSQL estiverem disponíveis no terminal, verifique a porta configurada (por padrão, `5432`):

```bash
pg_isready -h localhost -p 5432
```

O resultado esperado contém `accepting connections`. Isso confirma que o servidor aceita conexões; as credenciais e a existência do banco ainda precisam estar corretas. Veja a [documentação do pg_isready](https://www.postgresql.org/docs/current/app-pg-isready.html).

## Preparação inicial (uma vez por computador)

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

## Uso diário

Com a preparação inicial concluída, mantenha o PostgreSQL em execução. Se ele já inicia automaticamente, não é necessário iniciá-lo manualmente a cada uso. Instalar dependências, criar o banco e importar o SQL não são tarefas de cada inicialização.

1. **Em um terminal, inicie o backend:**

   ```bash
   cd server
   yarn dev
   ```

   A API será executada em [http://localhost:3000](http://localhost:3000).

2. **Em outro terminal, inicie o frontend:**

   ```bash
   cd client
   yarn dev
   ```

3. Abra **[http://localhost:5173](http://localhost:5173)** no navegador.

## Apresentar em outro computador

Clonar ou copiar o repositório leva o código e o arquivo `server/aportec.sql`, mas não instala o PostgreSQL, não copia o banco local e não configura os serviços do sistema. O arquivo `server/.env` também não é versionado e deve ser preenchido com as credenciais do computador de destino.

Para executar localmente em um computador da faculdade, siga **Pré-requisitos**, **Iniciar o PostgreSQL** e **Preparação inicial** nesse computador antes da apresentação. Depois, siga **Uso diário** e teste o login. As contas na seção abaixo são as criadas pela importação de `server/aportec.sql`; um banco já existente pode ter outras contas.

Confirme antecipadamente se há permissão para instalar os programas e iniciar o serviço do banco. Se a máquina não permitir essa preparação, use um computador já preparado ou uma versão da aplicação hospedada com backend e banco acessíveis. Nesse segundo caso, o frontend precisa apontar para a API hospedada por meio de `VITE_API_URL`; a URL padrão `http://localhost:3000` aponta para o computador em que o navegador está aberto.

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
