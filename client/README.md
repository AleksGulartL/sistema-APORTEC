# Frontend APORTEC (React + Material UI)

Frontend básico desenvolvido em React com **Material UI (MUI v6)** e **Vite**, baseado na arquitetura de fluxo de autenticação e consumo de API apresentada em `meu-app`.

## Tecnologias Utilizadas
- **React 18** + **Vite**
- **Material UI (`@mui/material`)** e **MUI Icons (`@mui/icons-material`)**
- **Axios** com interceptores para injeção automática de Bearer Token JWT e tratamento de expiração

## Estrutura de Componentes
- `src/services/api.js`: Instância centralizada do Axios com base URL (`http://localhost:3000`), injeção de token JWT nos cabeçalhos (`Authorization: Bearer <token>`) e interceptor para redirecionamento ao expirar.
- `src/components/Login.jsx`: Tela de autenticação com abas para **Login** e **Cadastro**, campos estilizados com validação, ícones e alertas informativos (`Alert`).
- `src/components/Navbar.jsx`: Barra superior com identificação visual do APORTEC, abas de navegação, chip de identificação do usuário conectado e botão de **Sair** (Logout).
- `src/components/Clientes.jsx`: Tela de gerenciamento de clientes com:
  - Consulta da listagem geral de clientes (`GET /cliente`)
  - Busca individual por ID (`GET /cliente/:id`) com card de detalhes e botão de retorno
  - Botão de atualização da lista e modal de criação de novo cliente (`POST /cliente`)
- `src/components/Tabela.jsx`: Tabela estilizada com componentes nativos do Material UI (`Table`, `TableHead`, `TableRow`, `TableCell`, `TableBody`, `Paper`).
- `src/components/Perfil.jsx`: Painel com resumo dos dados do usuário autenticado no sistema.

## Como Executar

### 1. Iniciar o Backend
```bash
cd ../server
yarn dev
# ou yarn start (porta padrão: 3000)
```

### 2. Iniciar o Frontend
```bash
cd client
yarn dev
```
Acesse no navegador: `http://localhost:5173`
