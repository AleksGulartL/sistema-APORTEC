-- =============================================================================
-- SISTEMA DE GESTÃO OPERACIONAL E PRODUTIVA - APORTEC
-- Modelagem Relacional Refatorada (3FN, Otimizada para ORM / Sequelize)
-- =============================================================================

-- Limpeza de estruturas legadas e tipos antigos para recriação limpa
DROP TABLE IF EXISTS movimentacao_estoque CASCADE;
DROP TABLE IF EXISTS peca_utilizada CASCADE;
DROP TABLE IF EXISTS insumo_ordem_producao CASCADE;
DROP TABLE IF EXISTS ordem_servico CASCADE;
DROP TABLE IF EXISTS porta_produto CASCADE;
DROP TABLE IF EXISTS ordem_producao CASCADE;
DROP TABLE IF EXISTS checklist_medicao CASCADE;
DROP TABLE IF EXISTS item_orcamento CASCADE;
DROP TABLE IF EXISTS pedido_item CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS orcamento CASCADE;
DROP TABLE IF EXISTS obra_servico CASCADE;
DROP TABLE IF EXISTS obra CASCADE;
DROP TABLE IF EXISTS item_catalogo CASCADE;
DROP TABLE IF EXISTS cliente CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;

DROP TYPE IF EXISTS tipo_perfil_enum CASCADE;
DROP TYPE IF EXISTS tipo_item_enum CASCADE;
DROP TYPE IF EXISTS tipo_orcamento_enum CASCADE;
DROP TYPE IF EXISTS status_aprovacao_enum CASCADE;
DROP TYPE IF EXISTS status_fluxo_pedido_enum CASCADE;
DROP TYPE IF EXISTS status_medicao_enum CASCADE;
DROP TYPE IF EXISTS status_op_enum CASCADE;
DROP TYPE IF EXISTS status_baixa_enum CASCADE;
DROP TYPE IF EXISTS tipo_servico_enum CASCADE;
DROP TYPE IF EXISTS origem_cobertura_enum CASCADE;
DROP TYPE IF EXISTS status_os_enum CASCADE;
DROP TYPE IF EXISTS tipo_movimentacao_enum CASCADE;

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
-- =============================================================================
CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(40) NOT NULL DEFAULT 'TECNICO',
    cargo_funcao VARCHAR(100),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT chk_usuario_perfil CHECK (
        perfil IN ('ADM', 'COMERCIAL', 'ENGENHARIA', 'PRODUCAO', 'ALMOXARIFADO', 'TECNICO')
    )
);

CREATE TRIGGER trg_usuario_updated_at
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 2. TABELA: cliente (RF02 - Cadastro Centralizado de Clientes PF/PJ)
-- =============================================================================
CREATE TABLE cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    telefone VARCHAR(25) NOT NULL,
    email VARCHAR(150) NOT NULL,
    endereco TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cliente_cnpj_cpf UNIQUE (cnpj_cpf)
);

CREATE TRIGGER trg_cliente_updated_at
BEFORE UPDATE ON cliente
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 3. TABELA: obra (RF03 - Locais de Instalação / Endereços do Cliente)
-- =============================================================================
CREATE TABLE obra (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    endereco_instalacao TEXT NOT NULL,
    responsavel_local VARCHAR(150),
    contato_local VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_obra_cliente FOREIGN KEY (cliente_id)
        REFERENCES cliente (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_obra_cliente_id ON obra (cliente_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_obra_updated_at
BEFORE UPDATE ON obra
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 4. TABELA: item_catalogo (RF04, RF10, RF11 - Catálogo e Saldos de Estoque)
-- =============================================================================
CREATE TABLE item_catalogo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_referencia VARCHAR(50),
    tipo VARCHAR(30) NOT NULL,
    categoria VARCHAR(50) NOT NULL DEFAULT 'GERAL',
    descricao TEXT NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    valor_unitario_padrao NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantidade_atual NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantidade_reservada NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estoque_minimo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_item_catalogo_codigo UNIQUE (codigo_referencia),
    CONSTRAINT chk_item_catalogo_tipo CHECK (
        tipo IN ('Insumo', 'Porta', 'Peca', 'Material', 'Servico', 'MATERIAL', 'SERVICO')
    ),
    CONSTRAINT chk_item_catalogo_saldos_nao_negativos CHECK (
        valor_unitario_padrao >= 0
        AND quantidade_atual >= 0
        AND quantidade_reservada >= 0
        AND estoque_minimo >= 0
    )
);

-- Índice parcial para alerta rápido de reposição de compras (RF10)
CREATE INDEX idx_item_catalogo_alerta_minimo
    ON item_catalogo (id, quantidade_atual, quantidade_reservada, estoque_minimo)
    WHERE (quantidade_atual - quantidade_reservada) <= estoque_minimo AND deleted_at IS NULL;

CREATE TRIGGER trg_item_catalogo_updated_at
BEFORE UPDATE ON item_catalogo
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 5. TABELA: pedido (RF04, RF05, RF06, RF08, RF09, RF12, RF13)
-- Unifica Orçamento Comercial + Pedido de Venda + Ordem de Produção (OP)
-- Normalizada em 3FN (cliente derivado via obra_id -> obra.cliente_id)
-- =============================================================================
CREATE TABLE pedido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_proposta VARCHAR(50) UNIQUE,
    obra_id BIGINT NOT NULL,
    usuario_criador_id BIGINT NOT NULL,
    responsavel_producao_id BIGINT NULL,
    tipo_pedido VARCHAR(50) NOT NULL,
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
    status_op VARCHAR(30) NOT NULL DEFAULT 'Planejada',
    bloqueio_fabricacao BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_bloqueio TEXT DEFAULT 'Aguardando aprovação comercial e checklist técnico de medição.',
    total_mercadorias NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_servicos NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    desconto_percentual NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    condicoes_pagamento TEXT,
    data_aprovacao TIMESTAMPTZ NULL,
    data_fechamento TIMESTAMPTZ NULL,
    data_conversao TIMESTAMPTZ NULL,
    data_inicio_producao TIMESTAMPTZ NULL,
    data_previsao_fim DATE NULL,
    data_conclusao TIMESTAMPTZ NULL,
    assinatura_cliente_instalacao TEXT NULL,
    data_aceite_instalacao TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pedido_obra FOREIGN KEY (obra_id)
        REFERENCES obra (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_usuario_criador FOREIGN KEY (usuario_criador_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pedido_responsavel_producao FOREIGN KEY (responsavel_producao_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pedido_tipo CHECK (
        tipo_pedido IN ('Instalacao', 'Manutencao Preventiva', 'Manutencao Corretiva', 'Misto')
    ),
    CONSTRAINT chk_pedido_status_aprovacao CHECK (
        status_aprovacao IN ('Pendente', 'Aprovado', 'Reprovado')
    ),
    CONSTRAINT chk_pedido_status_fluxo CHECK (
        status IN (
            'Rascunho',
            'Pendente',
            'Aguardando',
            'Planejada',
            'Em Fabricacao',
            'Montagem',
            'Testes',
            'Pronto para Instalacao',
            'Concluido',
            'Cancelado'
        )
    ),
    CONSTRAINT chk_pedido_status_op CHECK (
        status_op IN ('Planejada', 'Em Fabricacao', 'Concluida', 'Cancelada')
    ),
    CONSTRAINT chk_pedido_valores CHECK (
        total_mercadorias >= 0
        AND total_servicos >= 0
        AND valor_total >= 0
        AND desconto_percentual >= 0
        AND desconto_percentual <= 100
    ),
    -- Trava de segurança no banco (RF08): impede avanço produtivo se bloqueio_fabricacao = TRUE
    CONSTRAINT chk_pedido_desbloqueio_fabricacao CHECK (
        status NOT IN ('Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido')
        OR (bloqueio_fabricacao = FALSE AND status_aprovacao = 'Aprovado')
    )
);

CREATE INDEX idx_pedido_obra_id ON pedido (obra_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedido_status_bloqueio ON pedido (status, bloqueio_fabricacao) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_pedido_updated_at
BEFORE UPDATE ON pedido
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 6. TABELA: pedido_item (RF04, RF06 - Itens do Orçamento/Pedido com Snapshot)
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
-- 7. TABELA: checklist_medicao (RF07, RF08 - Levantamento Técnico e Validação)
-- =============================================================================
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
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    observacoes_pendencia TEXT,
    anexos JSONB NOT NULL DEFAULT '[]'::jsonb,
    anexo_croqui_url VARCHAR(255),
    anexo_fotos_url VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_checklist_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_checklist_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_checklist_tecnico FOREIGN KEY (tecnico_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_checklist_status CHECK (
        status_aprovacao IN ('Pendente', 'Aprovado', 'Reprovado')
    ),
    CONSTRAINT chk_checklist_folhas CHECK (quantidade_folhas > 0),
    -- Trava de segurança (RF07/RF08): impede aprovar checklist se houver pendência de infraestrutura
    CONSTRAINT chk_checklist_infraestrutura_aprovada CHECK (
        status_aprovacao <> 'Aprovado'
        OR (viga_ok = TRUE AND piso_ok = TRUE AND ponto_eletrico_ok = TRUE)
    )
);

CREATE TRIGGER trg_checklist_medicao_updated_at
BEFORE UPDATE ON checklist_medicao
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 8. TABELA: porta_produto (RF13, RF15 - Ativo Instalado / Prontuário da Porta)
-- =============================================================================
CREATE TABLE porta_produto (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_serie VARCHAR(100) NOT NULL,
    obra_id BIGINT NOT NULL,
    pedido_origem_id BIGINT NULL,
    modelo_automatizador VARCHAR(100) NOT NULL,
    data_instalacao DATE,
    fim_garantia_motor DATE,
    fim_garantia_geral DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_porta_numero_serie UNIQUE (numero_serie),
    CONSTRAINT fk_porta_obra FOREIGN KEY (obra_id)
        REFERENCES obra (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_porta_pedido_origem FOREIGN KEY (pedido_origem_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_porta_obra_id ON porta_produto (obra_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_porta_pedido_origem_id ON porta_produto (pedido_origem_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_porta_produto_updated_at
BEFORE UPDATE ON porta_produto
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 9. TABELA: ordem_servico (RF03, RF13, RF14, RF15 - Instalação e Assistência)
-- =============================================================================
CREATE TABLE ordem_servico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    obra_id BIGINT NOT NULL,
    porta_id BIGINT NULL,
    pedido_id BIGINT NULL,
    tecnico_responsavel_id BIGINT NOT NULL,
    tipo_servico VARCHAR(50) NOT NULL,
    origem_cobertura VARCHAR(30),
    descricao_problema TEXT,
    analise_especificacao_servico TEXT,
    observacoes TEXT,
    status_os VARCHAR(30) NOT NULL DEFAULT 'Aberta',
    data_agendamento TIMESTAMPTZ,
    data_hora_execucao_inicio TIMESTAMPTZ,
    data_hora_execucao_fim TIMESTAMPTZ,
    assinatura_cliente_digital TEXT,
    assinatura_tecnico_digital TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_os_obra FOREIGN KEY (obra_id)
        REFERENCES obra (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_porta FOREIGN KEY (porta_id)
        REFERENCES porta_produto (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_responsavel_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_os_tipo_servico CHECK (
        tipo_servico IN ('Instalacao', 'Manutencao Preventiva', 'Manutencao Corretiva')
    ),
    CONSTRAINT chk_os_origem_cobertura CHECK (
        origem_cobertura IS NULL OR origem_cobertura IN ('Garantia', 'Contrato', 'Avulso')
    ),
    CONSTRAINT chk_os_status CHECK (
        status_os IN ('Aberta', 'Em Andamento', 'Finalizada', 'Cancelada')
    )
);

CREATE INDEX idx_os_porta_historico ON ordem_servico (porta_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_os_obra_id ON ordem_servico (obra_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_ordem_servico_updated_at
BEFORE UPDATE ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 10. TABELA: movimentacao_estoque (RF09, RF10, RF11, RF15)
-- Ledger Unificado de Entradas, Reservas/Insumos de Produção e Peças de OS
-- =============================================================================
CREATE TABLE movimentacao_estoque (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    item_id BIGINT NOT NULL,
    usuario_id BIGINT NULL,
    pedido_id BIGINT NULL,
    ordem_servico_id BIGINT NULL,
    porta_id BIGINT NULL,
    tipo_movimentacao VARCHAR(40) NOT NULL,
    status_baixa VARCHAR(30) NOT NULL DEFAULT 'Baixado',
    quantidade_planejada NUMERIC(12, 2) NULL,
    quantidade NUMERIC(12, 2) NOT NULL,
    lote_serie_componente VARCHAR(100),
    fornecedor VARCHAR(150),
    data_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_mov_item FOREIGN KEY (item_id)
        REFERENCES item_catalogo (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_mov_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_mov_os FOREIGN KEY (ordem_servico_id)
        REFERENCES ordem_servico (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_mov_porta FOREIGN KEY (porta_id)
        REFERENCES porta_produto (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_mov_tipo CHECK (
        tipo_movimentacao IN ('Entrada', 'Reserva_Producao', 'Baixa_Producao', 'Baixa_OS', 'Ajuste', 'Estorno')
    ),
    CONSTRAINT chk_mov_status_baixa CHECK (
        status_baixa IN ('Pendente', 'Reservado', 'Baixado', 'Estornado')
    ),
    CONSTRAINT chk_mov_quantidade CHECK (
        quantidade >= 0 AND (quantidade_planejada IS NULL OR quantidade_planejada > 0)
    ),
    CONSTRAINT chk_mov_rastreabilidade_origem CHECK (
        (tipo_movimentacao IN ('Reserva_Producao', 'Baixa_Producao') AND pedido_id IS NOT NULL)
        OR (tipo_movimentacao = 'Baixa_OS' AND ordem_servico_id IS NOT NULL)
        OR (tipo_movimentacao IN ('Entrada', 'Ajuste', 'Estorno'))
    )
);

CREATE INDEX idx_mov_estoque_item_id ON movimentacao_estoque (item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mov_estoque_pedido_id ON movimentacao_estoque (pedido_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mov_estoque_os_id ON movimentacao_estoque (ordem_servico_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mov_estoque_porta_id ON movimentacao_estoque (porta_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_movimentacao_estoque_updated_at
BEFORE UPDATE ON movimentacao_estoque
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();
