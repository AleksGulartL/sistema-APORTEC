ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'Em Atendimento';
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS diagnostico_tecnico TEXT;
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS data_avaliacao TIMESTAMPTZ;
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS orcamento_enviado BOOLEAN NOT NULL DEFAULT FALSE;
-- Orçamentos anteriores já apresentados ao cliente continuam disponíveis.
UPDATE pedido SET orcamento_enviado = TRUE WHERE status NOT IN ('Recebida', 'Em Avaliacao', 'Rascunho');
INSERT INTO tipo_item (nome) VALUES ('Servico') ON CONFLICT (nome) DO NOTHING;
INSERT INTO categoria_item (nome) VALUES ('Serviços técnicos') ON CONFLICT (nome) DO NOTHING;
