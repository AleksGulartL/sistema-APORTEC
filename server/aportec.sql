CREATE TYPE tipo_perfil_enum AS ENUM (
    'ADM',
    'Tecnico',
    'Cliente'
);

CREATE TYPE tipo_item_enum AS ENUM (
    'Material',
    'Servico'
);
CREATE TYPE tipo_orcamento_enum AS ENUM (
    'Instalacao',
    'Manutencao Preventiva',
    'Manutencao Corretiva'
);

CREATE TYPE status_aprovacao_enum AS ENUM (
    'Pendente',
    'Aprovado',
    'Reprovado'
);

CREATE TYPE status_fluxo_pedido_enum AS ENUM (
    'Aguardando',
    'Em Fabricacao',
    'Montagem',
    'Testes',
    'Pronto para Instalacao',
    'Concluido'
);

CREATE TYPE status_medicao_enum AS ENUM (
    'Pendente',
    'Aprovado',
    'Reprovado'
);

CREATE TYPE status_op_enum AS ENUM (
    'Planejada',
    'Em Fabricacao',
    'Concluida',
    'Cancelada'
);

CREATE TYPE status_baixa_enum AS ENUM (
    'Pendente',
    'Baixado'
);
CREATE TYPE tipo_servico_enum AS ENUM (
    'Instalacao',
    'Manutencao Preventiva',
    'Manutencao Corretiva'
);

CREATE TYPE origem_cobertura_enum AS ENUM (
    'Garantia',
    'Contrato',
    'Avulso'
);

CREATE TYPE status_os_enum AS ENUM (
    'Aberta',
    'Em Andamento',
    'Finalizada',
    'Cancelada'
);

CREATE TYPE tipo_movimentacao_enum AS ENUM (
    'Entrada',
    'Baixa_Producao',
    'Baixa_OS',
    'Ajuste'
);

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    tipo_perfil tipo_perfil_enum NOT NULL,
    senha VARCHAR(255) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cliente (
    id_cliente SERIAL PRIMARY KEY,
    id_usuario INT,
    nome_completo VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) UNIQUE NOT NULL,
    telefone VARCHAR(25),
    email VARCHAR(150),
    endereco TEXT NOT NULL,
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE item_catalogo (
    id_item SERIAL PRIMARY KEY,
    codigo_referencia VARCHAR(50) UNIQUE,
    tipo tipo_item_enum NOT NULL,
    descricao TEXT NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    valor_unitario_padrao NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    quantidade_estoque NUMERIC(10, 2) DEFAULT 0.00
);

CREATE TABLE obra_servico (
    id_obra SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    endereco_instalacao TEXT NOT NULL,
    responsavel_local VARCHAR(150),
    contato_local VARCHAR(50),
    CONSTRAINT fk_obra_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente (id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE orcamento (
    id_orcamento SERIAL PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_obra INT NOT NULL,
    id_usuario_criador INT NOT NULL,
    tipo_orcamento tipo_orcamento_enum NOT NULL,
    total_mercadorias NUMERIC(10, 2) DEFAULT 0.00,
    total_servicos NUMERIC(10, 2) DEFAULT 0.00,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status_aprovacao status_aprovacao_enum DEFAULT 'Pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP,
    data_aprovacao TIMESTAMP,
    data_fechamento TIMESTAMP,
    CONSTRAINT fk_orcamento_cliente FOREIGN KEY (id_cliente) 
        REFERENCES cliente (id_cliente) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orcamento_obra FOREIGN KEY (id_obra) 
        REFERENCES obra_servico (id_obra) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_orcamento_usuario FOREIGN KEY (id_usuario_criador) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE item_orcamento (
    id_item_orcamento SERIAL PRIMARY KEY,
    id_orcamento INT NOT NULL,
    id_item_catalogo INT NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    valor_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_item_orcamento_orcamento FOREIGN KEY (id_orcamento) 
        REFERENCES orcamento (id_orcamento) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_item_orcamento_item_catalogo FOREIGN KEY (id_item_catalogo) 
        REFERENCES item_catalogo (id_item) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_orcamento INT UNIQUE NOT NULL,
    data_conversao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_fluxo status_fluxo_pedido_enum DEFAULT 'Aguardando',
    bloqueio_fabricacao BOOLEAN DEFAULT TRUE,
    motivo_bloqueio TEXT,
    CONSTRAINT fk_pedido_orcamento FOREIGN KEY (id_orcamento) 
        REFERENCES orcamento (id_orcamento) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE checklist_medicao (
    id_medicao SERIAL PRIMARY KEY,
    id_pedido INT UNIQUE NOT NULL,
    medidas_vao VARCHAR(100) NOT NULL,
    tipo_vidro VARCHAR(100),
    modelo_automatizador VARCHAR(100),
    status_aprovacao status_medicao_enum DEFAULT 'Pendente',
    anexo_croqui_url VARCHAR(255),
    anexo_fotos_url VARCHAR(255),
    CONSTRAINT fk_checklist_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE ordem_producao (
    id_op SERIAL PRIMARY KEY,
    id_pedido INT UNIQUE NOT NULL,
    id_responsavel_tecnico INT NOT NULL,
    data_inicio TIMESTAMP,
    data_previsao_fim DATE,
    data_conclusao TIMESTAMP,
    status_op status_op_enum DEFAULT 'Planejada',
    CONSTRAINT fk_op_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_op_tecnico FOREIGN KEY (id_responsavel_tecnico) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE insumo_ordem_producao (
    id_insumo_op SERIAL PRIMARY KEY,
    id_op INT NOT NULL,
    id_item INT NOT NULL,
    quantidade_planejada NUMERIC(10, 2) NOT NULL,
    quantidade_baixada NUMERIC(10, 2) DEFAULT 0.00,
    status_baixa status_baixa_enum DEFAULT 'Pendente',
    CONSTRAINT fk_insumo_op FOREIGN KEY (id_op) 
        REFERENCES ordem_producao (id_op) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_insumo_item FOREIGN KEY (id_item) 
        REFERENCES item_catalogo (id_item) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE porta_produto (
    id_porta SERIAL PRIMARY KEY,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    id_obra INT NOT NULL,
    id_pedido_origem INT,
    modelo_automatizador VARCHAR(100) NOT NULL,
    data_instalacao DATE,
    fim_garantia_motor DATE,
    fim_garantia_geral DATE,
    CONSTRAINT fk_porta_obra FOREIGN KEY (id_obra) 
        REFERENCES obra_servico (id_obra) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_porta_pedido FOREIGN KEY (id_pedido_origem) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE ordem_servico (
    id_os SERIAL PRIMARY KEY,
    id_obra INT NOT NULL,
    id_porta INT,
    id_tecnico_responsavel INT NOT NULL,
    tipo_servico tipo_servico_enum NOT NULL,
    origem_cobertura origem_cobertura_enum,
    descricao_problema TEXT,
    analise_especificacao_servico TEXT,
    observacoes TEXT,
    status_os status_os_enum DEFAULT 'Aberta',
    data_agendamento TIMESTAMP,
    data_hora_execucao_inicio TIMESTAMP,
    data_hora_execucao_fim TIMESTAMP,
    assinatura_cliente_digital TEXT,
    assinatura_tecnico_digital TEXT,
    CONSTRAINT fk_os_obra FOREIGN KEY (id_obra) 
        REFERENCES obra_servico (id_obra) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_porta FOREIGN KEY (id_porta) 
        REFERENCES porta_produto (id_porta) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_os_tecnico FOREIGN KEY (id_tecnico_responsavel) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE peca_utilizada (
    id_peca_os SERIAL PRIMARY KEY,
    id_os INT NOT NULL,
    id_item INT NOT NULL,
    quantidade_utilizada NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    CONSTRAINT fk_peca_os FOREIGN KEY (id_os) 
        REFERENCES ordem_servico (id_os) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_peca_item FOREIGN KEY (id_item) 
        REFERENCES item_catalogo (id_item) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE movimentacao_estoque (
    id_movimentacao SERIAL PRIMARY KEY,
    id_item INT NOT NULL,
    id_usuario INT NOT NULL,
    id_op INT,
    id_ordem_servico INT,
    tipo_movimentacao tipo_movimentacao_enum NOT NULL,
    quantidade NUMERIC(10, 2) NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fornecedor VARCHAR(150),
    CONSTRAINT fk_mov_item FOREIGN KEY (id_item) 
        REFERENCES item_catalogo (id_item) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_op FOREIGN KEY (id_op) 
        REFERENCES ordem_producao (id_op) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_mov_os FOREIGN KEY (id_ordem_servico) 
        REFERENCES ordem_servico (id_os) ON UPDATE CASCADE ON DELETE SET NULL
);