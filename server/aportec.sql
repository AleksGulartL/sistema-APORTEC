-- =============================================================================
-- SISTEMA DE GESTÃO OPERACIONAL E PRODUTIVA - APORTEC
-- Modelagem Relacional Normalizada (3FN - 9 Tabelas + Especialização 1:1)
-- =============================================================================

-- =============================================================================
-- 1. LIMPEZA DE ESTRUTURAS ANTERIORES
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
-- 2. TIPOS ENUMERADOS (DOMÍNIOS)
-- =============================================================================

CREATE TYPE perfil_usuario AS ENUM ('ADM', 'TECNICO', 'CLIENTE');
CREATE TYPE status_aprovacao AS ENUM ('Pendente', 'Aprovado', 'Reprovado');
CREATE TYPE status_pedido AS ENUM (
    'Recebida', 'Em Avaliacao', 'Rascunho', 'Pendente', 'Aguardando', 'Planejada', 'Em Fabricacao',
    'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido', 'Cancelado'
);
CREATE TYPE tipo_servico AS ENUM ('Instalacao', 'Manutencao Preventiva', 'Manutencao Corretiva');
CREATE TYPE origem_cobertura AS ENUM ('Garantia', 'Contrato', 'Avulso');
CREATE TYPE status_ordem_servico AS ENUM ('Aberta', 'Em Andamento', 'Finalizada', 'Cancelada');

-- =============================================================================
-- 3. TABELA: usuario (RF01 - Cadastro de Usuários, Login e Perfis RBAC)
-- =============================================================================
CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil perfil_usuario NOT NULL DEFAULT 'TECNICO',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

-- =============================================================================
-- 4. TABELA: cliente (RF02 - Especialização 1:1 de usuario)
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

-- =============================================================================
-- 5. TABELA: tipo_item (Domínio de tipos de itens do catálogo)
-- =============================================================================
CREATE TABLE tipo_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================================
-- 6. TABELA: categoria_item (Domínio de categorias de itens do catálogo)
-- =============================================================================
CREATE TABLE categoria_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
);

-- =============================================================================
-- 7. TABELA: item_catalogo (RF04, RF10, RF11 - Catálogo e Controle de Estoque)
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

-- =============================================================================
-- 8. TABELA: pedido (RF03, RF04, RF05, RF06, RF08, RF09, RF12, RF13, RF15)
-- Unifica Orçamento + Pedido/OP + Instalação + Prontuário da Porta
-- =============================================================================
CREATE TABLE pedido (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    usuario_criador_id BIGINT NOT NULL,
    responsavel_producao_id BIGINT NULL,
    descricao_solicitacao TEXT,
    pedido_origem_id BIGINT REFERENCES pedido (id) ON DELETE RESTRICT,
    endereco_instalacao TEXT,
    tipo_pedido tipo_servico NOT NULL DEFAULT 'Instalacao',
    status_aprovacao status_aprovacao NOT NULL DEFAULT 'Pendente',
    status status_pedido NOT NULL DEFAULT 'Rascunho',
    bloqueio_fabricacao BOOLEAN NOT NULL DEFAULT TRUE,
    motivo_bloqueio TEXT,
    custo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    percentual_acrescimo NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
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
    CONSTRAINT chk_pedido_valores_nao_negativos CHECK (
        custo_total >= 0 AND percentual_acrescimo >= 0
    ),
    CONSTRAINT chk_pedido_desbloqueio_fabricacao CHECK (
        status NOT IN ('Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido')
        OR (bloqueio_fabricacao = FALSE AND status_aprovacao = 'Aprovado')
    )
);

CREATE INDEX idx_pedido_cliente_id ON pedido (cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pedido_status_bloqueio ON pedido (status, bloqueio_fabricacao) WHERE deleted_at IS NULL;

-- =============================================================================
-- 9. TABELA: pedido_item (RF04, RF06, RF11 - Relação N:M entre Pedido e Item)
-- =============================================================================
CREATE TABLE pedido_item (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantidade NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
    valor_unitario NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_pedido_item_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pedido_item_catalogo FOREIGN KEY (item_id)
        REFERENCES item_catalogo (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_pedido_item_unico UNIQUE (pedido_id, item_id),
    CONSTRAINT chk_pedido_item_valores CHECK (
        quantidade > 0 AND valor_unitario >= 0
    )
);

CREATE INDEX idx_pedido_item_pedido_id ON pedido_item (pedido_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 10. TABELA: checklist_medicao (RF07, RF08 - Levantamento Técnico 1:1 com Pedido)
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

-- =============================================================================
-- 11. TABELA: ordem_servico (RF03, RF13, RF14, RF15 - Instalação e Pós-Venda)
-- =============================================================================
CREATE TABLE ordem_servico (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id BIGINT NOT NULL,
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
        REFERENCES pedido (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_os_tecnico FOREIGN KEY (tecnico_responsavel_id)
        REFERENCES usuario (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_os_pedido_id ON ordem_servico (pedido_id) WHERE deleted_at IS NULL;

-- =============================================================================
-- 12. CARGA INICIAL DE DADOS (OPERAÇÃO INICIAL E DEMONSTRAÇÃO)
-- Credenciais padrão (todas com senha: senha123):
--   ADM     : admin@gmail.com   | senha123
--   ADM     : alekslopes7@gmail.com | senha123
--   TECNICO : tecnico@gmail.com | senha123
--   CLIENTE : clara@gmail.com   | senha123
-- =============================================================================

INSERT INTO tipo_item (nome) VALUES
    ('Kit'),
    ('Equipamento sob medida'),
    ('Peca'),
    ('Insumo');

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

INSERT INTO usuario (nome_completo, email, senha_hash, perfil, ativo) VALUES
    ('Ana Administradora', 'admin@gmail.com', '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'ADM', TRUE),
    ('Aleksander Gulart', 'alekslopes7@gmail.com', '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'ADM', TRUE),
    ('Tiago Técnico', 'tecnico@gmail.com', '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'TECNICO', TRUE),
    ('Clara Cliente', 'clara@gmail.com', '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'CLIENTE', TRUE);

INSERT INTO cliente (usuario_id, cnpj_cpf, telefone, endereco) VALUES (
    (SELECT id FROM usuario WHERE email = 'clara@gmail.com'),
    '123.456.789-00',
    '(49) 99999-0101',
    'Av. Fernando Machado, 1200, Centro, Chapecó - SC'
);

INSERT INTO item_catalogo (
    codigo_referencia, tipo_id, categoria_id, descricao,
    unidade_medida, valor_unitario_padrao, quantidade_atual, estoque_minimo
) VALUES
    (
        'KIT-SLIM-200',
        (SELECT id FROM tipo_item WHERE nome = 'Kit'),
        (SELECT id FROM categoria_item WHERE nome = 'Automatizadores'),
        'Automatizador APORTEC Slim 200kg Bipartido com Central Digital',
        'UN', 3500.00, 12, 3
    ),
    (
        'VID-TEMP-10',
        (SELECT id FROM tipo_item WHERE nome = 'Equipamento sob medida'),
        (SELECT id FROM categoria_item WHERE nome = 'Vidros'),
        'Folha de Vidro Temperado 10mm Incolor Lapidado',
        'M2', 420.00, 35, 10
    ),
    (
        'SENS-RAD-01',
        (SELECT id FROM tipo_item WHERE nome = 'Peca'),
        (SELECT id FROM categoria_item WHERE nome = 'Sensores'),
        'Sensor Radar Micro-ondas de Movimento e Presença Duplo',
        'UN', 380.00, 2, 5
    ),
    (
        'PERF-ALU-6M',
        (SELECT id FROM tipo_item WHERE nome = 'Insumo'),
        (SELECT id FROM categoria_item WHERE nome = 'Trilhos e Perfis'),
        'Perfil Trilho Superior em Alumínio Anodizado 6 Metros',
        'UN', 290.00, 18, 6
    );

-- Pedido 1: Pronto para Instalação (aprovado e desbloqueado)
INSERT INTO pedido (
    cliente_id, usuario_criador_id, responsavel_producao_id,
    endereco_instalacao, tipo_pedido, status_aprovacao, status,
    bloqueio_fabricacao, motivo_bloqueio, custo_total, percentual_acrescimo,
    condicoes_pagamento, numero_serie, fim_garantia, data_aprovacao, data_previsao_fim
) VALUES (
    (SELECT id FROM usuario WHERE email = 'clara@gmail.com'),
    (SELECT id FROM usuario WHERE email = 'admin@gmail.com'),
    (SELECT id FROM usuario WHERE email = 'tecnico@gmail.com'),
    'Av. Fernando Machado, 1200, Centro, Chapecó - SC',
    'Instalacao', 'Aprovado', 'Pronto para Instalacao',
    FALSE, NULL, 5100.00, 15.00,
    '50% na aprovação e 50% após instalação',
    'APORTEC-2026-0001', CURRENT_DATE + INTERVAL '1 year',
    CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_DATE + INTERVAL '3 days'
);

-- Pedido 2: Pendente de aprovação comercial (com trava ativa)
INSERT INTO pedido (
    cliente_id, usuario_criador_id, responsavel_producao_id,
    endereco_instalacao, tipo_pedido, status_aprovacao, status,
    bloqueio_fabricacao, motivo_bloqueio, custo_total, percentual_acrescimo,
    condicoes_pagamento, data_previsao_fim
) VALUES (
    (SELECT id FROM usuario WHERE email = 'clara@gmail.com'),
    (SELECT id FROM usuario WHERE email = 'admin@gmail.com'),
    (SELECT id FROM usuario WHERE email = 'tecnico@gmail.com'),
    'Rua Marechal Bormann, 450, Chapecó - SC',
    'Instalacao', 'Pendente', 'Pendente',
    TRUE, 'Bloqueado: orçamento pendente de aprovação pelo cliente.',
    3880.00, 10.00,
    '3x sem juros no boleto corporativo',
    CURRENT_DATE + INTERVAL '12 days'
);

-- Itens dos Pedidos
INSERT INTO pedido_item (pedido_id, item_id, quantidade, valor_unitario) VALUES
    (1, (SELECT id FROM item_catalogo WHERE codigo_referencia = 'KIT-SLIM-200'), 1, 3500.00),
    (1, (SELECT id FROM item_catalogo WHERE codigo_referencia = 'VID-TEMP-10'), 2, 420.00),
    (1, (SELECT id FROM item_catalogo WHERE codigo_referencia = 'SENS-RAD-01'), 2, 380.00),
    (2, (SELECT id FROM item_catalogo WHERE codigo_referencia = 'KIT-SLIM-200'), 1, 3500.00),
    (2, (SELECT id FROM item_catalogo WHERE codigo_referencia = 'SENS-RAD-01'), 1, 380.00);

-- Checklists de Medição
INSERT INTO checklist_medicao (
    pedido_id, tecnico_id, medidas_vao, sentido_abertura, quantidade_folhas,
    tipo_vidro, modelo_automatizador, viga_ok, piso_ok, ponto_eletrico_ok, status_aprovacao
) VALUES
    (
        1,
        (SELECT id FROM usuario WHERE email = 'tecnico@gmail.com'),
        '2400mm x 2200mm', 'Bipartida (Central)', 2,
        'Temperado 10mm Incolor', 'APORTEC Slim 200kg',
        TRUE, TRUE, TRUE, 'Aprovado'
    ),
    (
        2,
        (SELECT id FROM usuario WHERE email = 'tecnico@gmail.com'),
        '1800mm x 2150mm', 'Lateral Direita', 1,
        'Temperado 10mm Verde', 'APORTEC Slim 200kg',
        TRUE, TRUE, TRUE, 'Aprovado'
    );

-- Ordens de Serviço
INSERT INTO ordem_servico (
    pedido_id, tecnico_responsavel_id, tipo_servico, origem_cobertura,
    status_os, descricao_problema, data_agendamento
) VALUES (
    1,
    (SELECT id FROM usuario WHERE email = 'tecnico@gmail.com'),
    'Instalacao', 'Garantia',
    'Em Andamento',
    'Instalação completa da porta social automática bipartida e calibração dos sensores.',
    CURRENT_TIMESTAMP + INTERVAL '2 days'
);
