-- Atualização incremental: preserva os registros existentes.
ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'Recebida';
ALTER TYPE status_pedido ADD VALUE IF NOT EXISTS 'Em Avaliacao';
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS descricao_solicitacao TEXT;
ALTER TABLE pedido ADD COLUMN IF NOT EXISTS pedido_origem_id BIGINT REFERENCES pedido (id) ON DELETE RESTRICT;
