-- Nova instalação não referencia uma porta/pedido anterior.
UPDATE pedido SET pedido_origem_id = NULL WHERE tipo_pedido = 'Instalacao' AND pedido_origem_id IS NOT NULL;
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS chk_instalacao_sem_pedido_origem;
ALTER TABLE pedido ADD CONSTRAINT chk_instalacao_sem_pedido_origem
    CHECK (tipo_pedido <> 'Instalacao' OR pedido_origem_id IS NULL);
