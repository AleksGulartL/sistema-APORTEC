-- =============================================================================
-- APORTEC – Dados de Teste
-- =============================================================================
-- Usuários de teste:
--   admin@aportec.com   | senha123 | perfil: ADM
--   tecnico@aportec.com | senha123 | perfil: TECNICO
--   clara@cliente.com   | senha123 | perfil: CLIENTE
-- =============================================================================

BEGIN;

-- Usuários
INSERT INTO usuario (nome_completo, email, senha_hash, perfil, ativo)
VALUES ('Ana Administradora', 'admin@aportec.com',
        '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'ADM', true)
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;

INSERT INTO usuario (nome_completo, email, senha_hash, perfil, ativo)
VALUES ('Tiago Técnico', 'tecnico@aportec.com',
        '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'TECNICO', true)
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;

INSERT INTO usuario (nome_completo, email, senha_hash, perfil, ativo)
VALUES ('Clara Cliente', 'clara@cliente.com',
        '$2b$10$1TbD.iSa19YbaFo2He4KfOrmXEnW8NoVhx6Re5b1zOAGO/zqzgXUS', 'CLIENTE', true)
ON CONFLICT (email) DO UPDATE SET senha_hash = EXCLUDED.senha_hash;

-- Cliente
INSERT INTO cliente (usuario_id, cnpj_cpf, telefone, endereco)
VALUES (
    (SELECT id FROM usuario WHERE email = 'clara@cliente.com'),
    '123.456.789-00',
    '(11) 99999-9999',
    'Rua das Flores, 123, São Paulo - SP'
) ON CONFLICT (usuario_id) DO NOTHING;

-- Tipo e Categoria
INSERT INTO tipo_item (nome) VALUES ('Porta') ON CONFLICT (nome) DO NOTHING;
INSERT INTO categoria_item (nome) VALUES ('Acessórios de Portas') ON CONFLICT (nome) DO NOTHING;

-- Item de catálogo
INSERT INTO item_catalogo (
    codigo_referencia, tipo_id, categoria_id, descricao,
    unidade_medida, valor_unitario_padrao, quantidade_atual, estoque_minimo
) VALUES (
    'PORTA-001',
    (SELECT id FROM tipo_item WHERE nome = 'Porta'),
    (SELECT id FROM categoria_item WHERE nome = 'Acessórios de Portas'),
    'Porta automática 900 mm – modelo padrão AP-X',
    'un', 3500.00, 50, 10
) ON CONFLICT (codigo_referencia) DO NOTHING;

-- Pedido 1 – Pronto para Instalação
INSERT INTO pedido (
    codigo_proposta, cliente_id, usuario_criador_id, responsavel_producao_id,
    endereco_instalacao, tipo_pedido, status_aprovacao, status,
    bloqueio_fabricacao, custo_total, percentual_acrescimo,
    numero_serie, fim_garantia
) VALUES (
    'PROP-001',
    (SELECT usuario_id FROM cliente WHERE usuario_id = (SELECT id FROM usuario WHERE email = 'clara@cliente.com')),
    (SELECT id FROM usuario WHERE email = 'admin@aportec.com'),
    (SELECT id FROM usuario WHERE email = 'tecnico@aportec.com'),
    'Av. Paulista, 1000, São Paulo - SP',
    'Instalacao', 'Aprovado', 'Pronto para Instalacao',
    false, 3500.00, 10.00,
    'APORTEC-2026-001', CURRENT_DATE + INTERVAL '2 year'
) ON CONFLICT (codigo_proposta) DO NOTHING;

-- Pedido 2 – Rascunho
INSERT INTO pedido (
    codigo_proposta, cliente_id, usuario_criador_id,
    endereco_instalacao, tipo_pedido, status_aprovacao, status,
    bloqueio_fabricacao, custo_total, percentual_acrescimo
) VALUES (
    'PROP-002',
    (SELECT usuario_id FROM cliente WHERE usuario_id = (SELECT id FROM usuario WHERE email = 'clara@cliente.com')),
    (SELECT id FROM usuario WHERE email = 'admin@aportec.com'),
    'Rua das Acácias, 200, São Paulo - SP',
    'Instalacao', 'Pendente', 'Rascunho',
    true, 0.00, 0.00
) ON CONFLICT (codigo_proposta) DO NOTHING;

-- Pedido 3 – Em Fabricação
INSERT INTO pedido (
    codigo_proposta, cliente_id, usuario_criador_id, responsavel_producao_id,
    endereco_instalacao, tipo_pedido, status_aprovacao, status,
    bloqueio_fabricacao, custo_total, percentual_acrescimo, fim_garantia
) VALUES (
    'PROP-003',
    (SELECT usuario_id FROM cliente WHERE usuario_id = (SELECT id FROM usuario WHERE email = 'clara@cliente.com')),
    (SELECT id FROM usuario WHERE email = 'admin@aportec.com'),
    (SELECT id FROM usuario WHERE email = 'tecnico@aportec.com'),
    'Rua Nova, 500, São Paulo - SP',
    'Instalacao', 'Aprovado', 'Em Fabricacao',
    false, 3500.00, 5.00, CURRENT_DATE + INTERVAL '2 year'
) ON CONFLICT (codigo_proposta) DO NOTHING;

-- Itens dos pedidos
INSERT INTO pedido_item (pedido_id, item_id, quantidade, valor_unitario)
VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-001'),
    (SELECT id FROM item_catalogo WHERE codigo_referencia = 'PORTA-001'),
    1, 3500.00
) ON CONFLICT DO NOTHING;

INSERT INTO pedido_item (pedido_id, item_id, quantidade, valor_unitario)
VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-002'),
    (SELECT id FROM item_catalogo WHERE codigo_referencia = 'PORTA-001'),
    1, 3500.00
) ON CONFLICT DO NOTHING;

INSERT INTO pedido_item (pedido_id, item_id, quantidade, valor_unitario)
VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-003'),
    (SELECT id FROM item_catalogo WHERE codigo_referencia = 'PORTA-001'),
    1, 3500.00
) ON CONFLICT DO NOTHING;

-- Ordens de Serviço
INSERT INTO ordem_servico (
    pedido_id, tecnico_responsavel_id, tipo_servico, status_os, origem_cobertura,
    data_conclusao, assinatura_cliente_digital
) VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-001'),
    (SELECT id FROM usuario WHERE email = 'tecnico@aportec.com'),
    'Instalacao', 'Finalizada', 'Garantia',
    CURRENT_TIMESTAMP, 'assinatura_dummy'
) ON CONFLICT DO NOTHING;

INSERT INTO ordem_servico (
    pedido_id, tipo_servico, status_os, origem_cobertura
) VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-002'),
    'Instalacao', 'Aberta', 'Contrato'
) ON CONFLICT DO NOTHING;

INSERT INTO ordem_servico (
    pedido_id, tecnico_responsavel_id, tipo_servico, status_os, origem_cobertura
) VALUES (
    (SELECT id FROM pedido WHERE codigo_proposta = 'PROP-003'),
    (SELECT id FROM usuario WHERE email = 'tecnico@aportec.com'),
    'Instalacao', 'Em Andamento', 'Garantia'
) ON CONFLICT DO NOTHING;

COMMIT;
