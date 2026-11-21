# Frontend APORTEC (React + Material UI)

Interface web da aplicação **APORTEC**, desenvolvida em **React 18** com **Material UI (MUI v6)** e **Vite**, integrada à API REST do backend via **Axios** com autenticação JWT e controle de acesso por perfil (`ADM`, `TECNICO` e `CLIENTE`).

## Tecnologias Utilizadas

- **React 18** + **Vite 6**
- **Material UI (`@mui/material`)** e **MUI Icons (`@mui/icons-material`)**
- **Axios** com interceptores para injeção automática do token JWT (`Authorization: Bearer <token>`) e tratamento de expiração de sessão (`auth:expired`)

## Estrutura de Módulos e Componentes

- `src/services/api.js`: Instância centralizada do Axios (`http://localhost:3000`) com interceptores de autenticação.
- `src/utils/permissoes.js` e `src/utils/validacoes.js`: Helpers de RBAC por perfil, formatação (datas/moeda), ordenação de listas, cálculo de garantia e validação de e-mail (`@` e `.com`).
- `src/components/Login.jsx`: Tela de autenticação com logo APORTEC, exibição/ocultação de senha e tratamento de erros da API.
- `src/components/Navbar.jsx`: Barra de navegação responsiva adaptada ao perfil conectado (`ADM`/`TECNICO` vs. `CLIENTE`), acesso ao perfil e botão de **Sair**.
- `src/components/Dashboard.jsx` e `src/components/dashboard/`: Painel operacional com KPIs (`DashboardKpis.jsx`), calendário de entregas e OS (`AgendaCalendario.jsx`), levantamento operacional (`LevantamentoOperacional.jsx`) e modal de detalhes (`DetalheEventoDialog.jsx`).
- `src/components/Pedidos.jsx` e `src/components/pedidos/PedidoDetalhe.jsx`: Gestão unificada de solicitações, proposta comercial (envio/reabertura), itens do pedido, checklist técnico de medição em obra, avanço de produção e checklist de pré-saída.
- `src/components/CatalogoEstoque.jsx`: Controle de catálogo de itens, alertas de estoque mínimo, filtros por tipo/categoria e ordenação.
- `src/components/OrdensServico.jsx`: Abertura, agendamento e registro de parecer técnico de ordens de serviço.
- `src/components/ProntuarioPorta.jsx`: Consulta consolidada por número de série ou cliente (garantia, especificações técnicas, peças, assinatura de aceite e histórico de OS).
- `src/components/Clientes.jsx` e `src/components/Usuarios.jsx`: Cadastros de clientes (com acesso ao portal) e gerenciamento de colaboradores (`ADM`).
- `src/components/PortalCliente.jsx` e `src/components/PedidoClienteDetalhe.jsx`: Portal exclusivo do `CLIENTE` com resumo (**Início**), aprovação/reprovação de orçamentos (**Meus Pedidos**), consulta de portas e garantias (**Minhas Portas**), abertura de solicitações e assinatura digital por texto para conclusão do atendimento (**Atendimentos**).
- `src/components/Perfil.jsx`: Visualização dos dados da conta conectada e alteração de senha.
- `src/components/comum/AssinaturaDigital.jsx` e `src/components/comum/CabecalhoOrdenavel.jsx`: Componentes reutilizáveis de assinatura por texto/visualização de aceite e cabeçalho ordenável de tabelas.

## Como Executar

### 1. Instalar as Dependências
```bash
cd client
yarn install
```

### 2. Iniciar o Backend
```bash
cd ../server
yarn dev
# ou yarn start (porta padrão: 3000)
```

### 3. Iniciar o Frontend
```bash
cd client
yarn dev
```
Acesse no navegador: `http://localhost:5173`

### 4. Gerar Build de Produção
```bash
cd client
yarn build
```
