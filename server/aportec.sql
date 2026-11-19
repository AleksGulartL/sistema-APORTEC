-- =============================================================================
-- SISTEMA DE GESTÃO OPERACIONAL E PRODUTIVA - APORTEC
-- Modelagem Relacional Simplificada (3FN - 9 Tabelas + Especialização 1:1)
-- =============================================================================

-- =============================================================================
-- Limpeza antes de comecar
-- =============================================================================

DROP TABLE IF EXISTS ordem_servico CASCADE;
DROP TABLE IF EXISTS checklist_medicao CASCADE;
DROP TABLE IF EXISTS pedido_item CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS item_catalogo CASCADE;
DROP TABLE IF EXISTS categoria_item CASCADE;
DROP TABLE IF EXISTS tipo_item CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

DROP TYPE IF EXISTS perfil_usuario;
DROP TYPE IF EXISTS tipo_item_catalogo;
DROP TYPE IF EXISTS status_aprovacao;
DROP TYPE IF EXISTS status_pedido;
DROP TYPE IF EXISTS tipo_servico;
DROP TYPE IF EXISTS origem_cobertura;
DROP TYPE IF EXISTS status_ordem_servico;

-- =============================================================================
-- Tipos (ENUMs)
-- =============================================================================

CREATE TYPE perfil_usuario AS ENUM ('ADM', 'TECNICO', 'CLIENTE');
CREATE TYPE status_aprovacao AS ENUM ('Pendente', 'Aprovado', 'Reprovado');
CREATE TYPE status_pedido AS ENUM (
    'Rascunho', 'Pendente', 'Aguardando', 'Planejada', 'Em Fabricacao',
    'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido', 'Cancelado'
);
CREATE TYPE tipo_servico AS ENUM ('Instalacao', 'Manutencao Preventiva', 'Manutencao Corretiva');
CREATE TYPE origem_cobertura AS ENUM ('Garantia', 'Contrato', 'Avulso');
CREATE TYPE status_ordem_servico AS ENUM ('Aberta', 'Em Andamento', 'Finalizada', 'Cancelada');

-- =============================================================================
-- FUNÇÃO DE AUDITORIA AUTOMÁTICA (updated_at)
-- =============================================================================
CREATE OR REPLACE FUNCTION atualizar_coluna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. TABELA: usuario (RF01 - Cadastro de Usuários, Login e Perfis RBAC)
-- Centraliza nome_completo e email para todos os atores do sistema (ADM, TECNICO, CLIENTE)
-- =============================================================================
CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- 'GENERATED ALWAYS AS IDENTITY' Mais atual e seguro. 'Serial' Permite informar IDs manualmente
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL,
    -- cargo_funcao VARCHAR(100), -- Acho melhor remover.
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_usuario_email UNIQUE (email) -- Impede que dois usuarios tenham o mesmo e-mail.
);

CREATE TRIGGER trg_usuario_updated_at
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 2. TABELA: cliente (RF02 - Especialização 1:1 de usuario sem repetir nome/email)
-- =============================================================================
CREATE TABLE cliente (
    usuario_id BIGINT PRIMARY KEY,
    cnpj_cpf VARCHAR(20) NOT NULL,
    telefone VARCHAR(25) NOT NULL,
    endereco TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cliente_cnpj_cpf UNIQUE (cnpj_cpf),
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TRIGGER trg_cliente_updated_at
BEFORE UPDATE ON cliente
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 3. TABELA: tipo_item (Tipos de itens cadastráveis)
-- =============================================================================
CREATE TABLE tipo_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO tipo_item (nome) VALUES
    ('Kit'),
    ('Equipamento sob medida'),
    ('Peca'),
    ('Insumo');

-- =============================================================================
-- 4. TABELA: categoria_item (Categorias cadastráveis)
-- =============================================================================
CREATE TABLE categoria_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categoria_item (nome) VALUES
    ('Automatizadores'),
    ('Motores'),
    ('Centrais Eletronicas'),
    ('Trilhos e Perfis'),
    ('Vidros'),
    ('Fechaduras'),
    ('Sensores'),
    ('Controles de Acesso'),
    ('Componentes Eletricos'),
    ('Ferragens'),
    ('Fixadores'),
    ('Adesivos e Vedantes'),
    ('Cabos e Fios'),
    ('Acessorios'),
    ('Outros');
-- =============================================================================
-- 5. TABELA: item_catalogo (RF04, RF10, RF11 - Catálogo e Controle de Estoque)
-- =============================================================================
CREATE TABLE item_catalogo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_referencia VARCHAR(50),
    tipo_id BIGINT NOT NULL,
    categoria_id BIGINT NOT NULL,
    descricao TEXT NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    valor_unitario_padrao NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantidade_atual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estoque_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_catalogo_codigo UNIQUE (codigo_referencia),
    CONSTRAINT fk_item_catalogo_tipo FOREIGN KEY (tipo_id)
        REFERENCES tipo_item (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_item_catalogo_categoria FOREIGN KEY (categoria_id)
        REFERENCES categoria_item (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_item_catalogo_saldos_nao_negativos CHECK (
        valor_unitario_padrao >= 0
        AND quantidade_atual >= 0
        AND estoque_minimo >= 0
    )
);

CREATE INDEX idx_item_catalogo_alerta_minimo
    ON item_catalogo (id, quantidade_atual, estoque_minimo)
    WHERE quantidade_atual <= estoque_minimo AND deleted_at IS NULL;

CREATE TRIGGER trg_item_catalogo_updated_at
BEFORE UPDATE ON item_catalogo
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 6. TABELA: pedido (RF03, RF04, RF05, RF06, RF08, RF09, RF12, RF13, RF15)
-- Unifica Orçamento + Pedido/OP + Local de Instalação + Prontuário da Porta
-- =============================================================================
CREATE TABLE pedido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_proposta VARCHAR(50) UNIQUE,
    cliente_id BIGINT NOT NULL,
    usuario_criador_id BIGINT NOT NULL,
    responsavel_producao_id BIGINT NULL,
    endereco_instalacao TEXT,
    tipo_pedido tipo_servico NOT NULL,
    status_aprovacao status_aprovacao NOT NULL DEFAULT 'Pendente',
    status status_pedido NOT NULL DEFAULT 'Rascunho',
    bloqueio_fabricacao BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_bloqueio TEXT,
    custo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    percentual_acrescimo NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    condicoes_pagamento TEXT,
    numero_serie VARCHAR(100) UNIQUE,
    fim_garantia DATE NULL,
    assinatura_cliente_instalacao TEXT NULL,
    data_aprovacao TIMESTAMPTZ NULL,
    data_previsao_fim DATE NULL,
    data_conclusao TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)
        REFERENCES cliente (usuario_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_usuario_criador FOREIGN KEY (usuario_criador_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_responsavel_producao FOREIGN KEY (responsavel_producao_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pedido_valor_total CHECK (valor_total >= 0),
    -- CHECK valida uma combinacao de colunas; ENUM limita apenas os valores de cada coluna.
    -- Impede avancar na producao enquanto bloqueado ou sem aprovacao comercial.
    CONSTRAINT chk_pedido_desbloqueio_fabricacao CHECK (
        status NOT IN ('Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido')
        OR (bloqueio_fabricacao = FALSE AND status_aprovacao = 'Aprovado')
    )
);

CREATE INDEX idx_pedido_cliente_id ON pedido (cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedido_status_bloqueio ON pedido (status, bloqueio_fabricacao) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_pedido_updated_at
BEFORE UPDATE ON pedido
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 7. TABELA: pedido_item (RF04, RF06, RF11 - Relação N:M entre Pedido e Item)
-- =============================================================================
CREATE TABLE pedido_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantidade NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pedido_item_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pedido_item_catalogo FOREIGN KEY (item_id)
        REFERENCES item_catalogo (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_pedido_item_unico UNIQUE (pedido_id, item_id),
    CONSTRAINT chk_pedido_item_valores CHECK (
        quantidade > 0 AND valor_unitario >= 0 AND valor_total >= 0
    )
);

CREATE INDEX idx_pedido_item_pedido_id ON pedido_item (pedido_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_pedido_item_updated_at
BEFORE UPDATE ON pedido_item
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 8. TABELA: checklist_medicao (RF07, RF08 - Levantamento Técnico 1:1 com Pedido)
-- =============================================================================
-- TODO (discutir): checklist precisa atender também biometria, fechaduras e outros equipamentos?
-- Avaliar substituir medidas e atributos específicos de portas por um campo geral de detalhes técnicos.
-- Avaliar dispensar a aprovação do checklist: técnico registra, ADM prepara orçamento e cliente aprova só o orçamento.
CREATE TABLE checklist_medicao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    tecnico_id BIGINT NULL,
    medidas_vao VARCHAR(100) NOT NULL,
    sentido_abertura VARCHAR(50),
    quantidade_folhas INT NOT NULL DEFAULT 1,
    tipo_vidro VARCHAR(100),
    modelo_automatizador VARCHAR(100),
    viga_ok BOOLEAN NOT NULL DEFAULT TRUE,
    piso_ok BOOLEAN NOT NULL DEFAULT TRUE,
    ponto_eletrico_ok BOOLEAN NOT NULL DEFAULT TRUE,
    status_aprovacao status_aprovacao NOT NULL DEFAULT 'Pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_checklist_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_checklist_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_checklist_tecnico FOREIGN KEY (tecnico_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_checklist_folhas CHECK (quantidade_folhas > 0),
    CONSTRAINT chk_checklist_infraestrutura_aprovada CHECK (
        status_aprovacao <> 'Aprovado'
        OR (viga_ok = TRUE AND piso_ok = TRUE AND ponto_eletrico_ok = TRUE)
    )
);

CREATE TRIGGER trg_checklist_medicao_updated_at
BEFORE UPDATE ON checklist_medicao
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 9. TABELA: ordem_servico (RF03, RF13, RF14, RF15 - Instalação e Pós-Venda)
-- =============================================================================
CREATE TABLE ordem_servico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NULL,
    cliente_id BIGINT NOT NULL,
    tecnico_responsavel_id BIGINT NULL,
    tipo_servico tipo_servico NOT NULL,
    origem_cobertura origem_cobertura,
    status_os status_ordem_servico NOT NULL DEFAULT 'Aberta',
    descricao_problema TEXT,
    parecer_tecnico TEXT,
    assinatura_cliente_digital TEXT,
    data_agendamento TIMESTAMPTZ,
    data_conclusao TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_os_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_os_cliente FOREIGN KEY (cliente_id)
        REFERENCES cliente (usuario_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_responsavel_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_os_cliente_id ON ordem_servico (cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_os_pedido_id ON ordem_servico (pedido_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_ordem_servico_updated_at
BEFORE UPDATE ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();
