-- =============================================================================
-- SISTEMA DE GESTÃO OPERACIONAL E PRODUTIVA - APORTEC
-- Modelagem Relacional Simplificada (3FN - 7 Tabelas + Especialização 1:1)
-- =============================================================================

-- Limpeza de estruturas legadas e atuais para recriação limpa
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
-- Centraliza nome_completo e email para todos os atores do sistema (incluindo CLIENTE)
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
        perfil IN ('ADM', 'COMERCIAL', 'ENGENHARIA', 'PRODUCAO', 'ALMOXARIFADO', 'TECNICO', 'CLIENTE')
    )
);

CREATE TRIGGER trg_usuario_updated_at
BEFORE UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 2. TABELA: cliente (RF02 - Especialização 1:1 de usuario sem repetir nome/email)
-- =============================================================================
CREATE TABLE cliente (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    telefone VARCHAR(25) NOT NULL,
    endereco TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cliente_usuario UNIQUE (usuario_id),
    CONSTRAINT uq_cliente_cnpj_cpf UNIQUE (cnpj_cpf),
    CONSTRAINT fk_cliente_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_cliente_usuario_id ON cliente (usuario_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_cliente_updated_at
BEFORE UPDATE ON cliente
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 3. TABELA: item_catalogo (RF04, RF10, RF11 - Catálogo e Controle Direto de Estoque)
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
-- 4. TABELA: pedido (RF03, RF04, RF05, RF06, RF08, RF09, RF12, RF13, RF15)
-- Unifica Orçamento + Pedido/OP + Local de Instalação + Prontuário da Porta Instalada
-- =============================================================================
CREATE TABLE pedido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_proposta VARCHAR(50) UNIQUE,
    cliente_id BIGINT NOT NULL,
    usuario_criador_id BIGINT NOT NULL,
    responsavel_producao_id BIGINT NULL,
    endereco_instalacao TEXT,
    tipo_pedido VARCHAR(50) NOT NULL DEFAULT 'Instalacao',
    status_aprovacao VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
    bloqueio_fabricacao BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_bloqueio TEXT DEFAULT 'Aguardando aprovação comercial e checklist técnico de medição.',
    valor_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    condicoes_pagamento TEXT,
    numero_serie_porta VARCHAR(100) UNIQUE,
    fim_garantia DATE NULL,
    assinatura_cliente_instalacao TEXT NULL,
    data_aprovacao TIMESTAMPTZ NULL,
    data_previsao_fim DATE NULL,
    data_conclusao TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id)
        REFERENCES cliente (id) ON UPDATE CASCADE ON DELETE RESTRICT,
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
    CONSTRAINT chk_pedido_valor_total CHECK (valor_total >= 0),
    -- Trava de segurança no banco (RF08): impede avanço produtivo se bloqueio_fabricacao = TRUE
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
-- 5. TABELA: pedido_item (RF04, RF06, RF11 - Relação N:M entre Pedido e Item)
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
-- 6. TABELA: checklist_medicao (RF07, RF08 - Levantamento Técnico 1:1 com Pedido)
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
    CONSTRAINT chk_checklist_infraestrutura_aprovada CHECK (
        status_aprovacao <> 'Aprovado'
        OR (viga_ok = TRUE AND piso_ok = TRUE AND ponto_eletrico_ok = TRUE)
    )
);

CREATE TRIGGER trg_checklist_medicao_updated_at
BEFORE UPDATE ON checklist_medicao
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 7. TABELA: ordem_servico (RF03, RF13, RF14, RF15 - Instalação e Pós-Venda)
-- =============================================================================
CREATE TABLE ordem_servico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NULL,
    cliente_id BIGINT NOT NULL,
    tecnico_responsavel_id BIGINT NOT NULL,
    tipo_servico VARCHAR(50) NOT NULL,
    origem_cobertura VARCHAR(30),
    status_os VARCHAR(30) NOT NULL DEFAULT 'Aberta',
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
        REFERENCES cliente (id) ON UPDATE CASCADE ON DELETE RESTRICT,
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

CREATE INDEX idx_os_cliente_id ON ordem_servico (cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_os_pedido_id ON ordem_servico (pedido_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_ordem_servico_updated_at
BEFORE UPDATE ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION atualizar_coluna_updated_at();

-- =============================================================================
-- 5 CONSULTAS SQL PARA AVALIAÇÃO DE BANCO DE DADOS I
-- (JOIN, GROUP BY, HAVING, Subconsultas sobre o esquema enxuto de 7 tabelas)
-- =============================================================================

/*
-- CONSULTA 1: Faturamento e Volume de Pedidos por Cliente (JOIN + GROUP BY + HAVING)
SELECT
    c.id AS cliente_id,
    u.nome_completo AS nome_cliente,
    u.email AS email_cliente,
    c.cnpj_cpf,
    COUNT(p.id) AS total_pedidos,
    SUM(p.valor_total) AS faturamento_acumulado
FROM cliente c
INNER JOIN usuario u ON u.id = c.usuario_id
INNER JOIN pedido p ON p.cliente_id = c.id
WHERE p.deleted_at IS NULL
  AND p.status = 'Concluido'
GROUP BY c.id, u.nome_completo, u.email, c.cnpj_cpf
HAVING SUM(p.valor_total) > 10000.00
ORDER BY faturamento_acumulado DESC;

-- CONSULTA 2: Ranking de Insumos e Motores Mais Utilizados nos Pedidos (JOIN Triplo + GROUP BY)
SELECT
    ic.id AS item_id,
    ic.codigo_referencia,
    ic.descricao,
    ic.categoria,
    SUM(pi.quantidade) AS quantidade_total_utilizada,
    SUM(pi.valor_total) AS receita_gerada_item
FROM item_catalogo ic
INNER JOIN pedido_item pi ON pi.item_id = ic.id
INNER JOIN pedido p ON p.id = pi.pedido_id
WHERE p.status_aprovacao = 'Aprovado'
  AND pi.deleted_at IS NULL
GROUP BY ic.id, ic.codigo_referencia, ic.descricao, ic.categoria
ORDER BY quantidade_total_utilizada DESC;

-- CONSULTA 3: Produtividade da Equipe Técnica em Ordens de Serviço (LEFT JOIN + GROUP BY)
SELECT
    u.id AS tecnico_id,
    u.nome_completo AS nome_tecnico,
    u.email,
    COUNT(os.id) AS total_os_atendidas,
    COUNT(CASE WHEN os.tipo_servico = 'Manutencao Corretiva' THEN 1 END) AS total_manutencoes_corretivas
FROM usuario u
LEFT JOIN ordem_servico os
    ON os.tecnico_responsavel_id = u.id
    AND os.status_os = 'Finalizada'
    AND os.deleted_at IS NULL
WHERE u.perfil = 'TECNICO'
  AND u.deleted_at IS NULL
GROUP BY u.id, u.nome_completo, u.email
ORDER BY total_os_atendidas DESC;

-- CONSULTA 4: Alerta de Insumos Abaixo do Estoque Mínimo Demandados em Produção (Subconsulta + EXISTS)
SELECT
    ic.id,
    ic.codigo_referencia,
    ic.descricao,
    ic.quantidade_atual,
    ic.estoque_minimo
FROM item_catalogo ic
WHERE ic.quantidade_atual <= ic.estoque_minimo
  AND ic.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM pedido_item pi
      INNER JOIN pedido p ON p.id = pi.pedido_id
      WHERE pi.item_id = ic.id
        AND p.status IN ('Aguardando', 'Em Fabricacao')
        AND p.deleted_at IS NULL
  )
ORDER BY ic.quantidade_atual ASC;

-- CONSULTA 5: Pedidos Acima do Ticket Médio com Dados do Cliente e Status do Checklist (Subconsulta Escalar + JOIN)
SELECT
    p.id AS pedido_id,
    p.codigo_proposta,
    u_cli.nome_completo AS cliente_nome,
    u_cli.email AS cliente_email,
    cm.status_aprovacao AS status_checklist,
    p.valor_total
FROM pedido p
INNER JOIN cliente c ON c.id = p.cliente_id
INNER JOIN usuario u_cli ON u_cli.id = c.usuario_id
LEFT JOIN checklist_medicao cm ON cm.pedido_id = p.id
WHERE p.deleted_at IS NULL
  AND p.valor_total > (
      SELECT AVG(p2.valor_total)
      FROM pedido p2
      WHERE p2.deleted_at IS NULL
  )
ORDER BY p.valor_total DESC;
*/
