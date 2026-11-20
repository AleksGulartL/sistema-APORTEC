ALTER TABLE pedido DROP CONSTRAINT IF EXISTS chk_pedido_desbloqueio_fabricacao;
ALTER TABLE pedido ADD CONSTRAINT chk_pedido_desbloqueio_fabricacao CHECK (
    status NOT IN ('Em Atendimento', 'Em Fabricacao', 'Montagem', 'Testes', 'Pronto para Instalacao', 'Concluido')
    OR (bloqueio_fabricacao = FALSE AND status_aprovacao = 'Aprovado' AND orcamento_enviado = TRUE)
);
ALTER TABLE pedido DROP CONSTRAINT IF EXISTS chk_atendimento_diagnosticado;
ALTER TABLE pedido ADD CONSTRAINT chk_atendimento_diagnosticado CHECK (
    status <> 'Em Atendimento' OR (tipo_pedido IN ('Manutencao Corretiva', 'Manutencao Preventiva') AND length(trim(diagnostico_tecnico)) > 0 AND diagnostico_tecnico IS NOT NULL)
);
CREATE OR REPLACE FUNCTION proteger_itens_orcamento() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE destino BIGINT;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.pedido_id <> OLD.pedido_id THEN
        RAISE EXCEPTION 'Não é permitido transferir itens entre orçamentos.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN destino := OLD.pedido_id; ELSE destino := NEW.pedido_id; END IF;
    PERFORM id FROM pedido WHERE id = destino FOR UPDATE;
    IF EXISTS (SELECT 1 FROM pedido WHERE id = destino AND (orcamento_enviado OR status IN ('Cancelado', 'Concluido'))) THEN
        RAISE EXCEPTION 'Reabra o orçamento para revisão antes de alterar seus itens.' USING ERRCODE = '23514';
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;
DROP TRIGGER IF EXISTS proteger_itens_orcamento ON pedido_item;
CREATE TRIGGER proteger_itens_orcamento BEFORE INSERT OR UPDATE OR DELETE ON pedido_item
FOR EACH ROW EXECUTE FUNCTION proteger_itens_orcamento();
CREATE OR REPLACE FUNCTION proteger_execucao_os() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE orcamento pedido%ROWTYPE;
BEGIN
    IF NEW.status_os IN ('Em Andamento', 'Finalizada') THEN
        SELECT * INTO orcamento FROM pedido WHERE id = NEW.pedido_id AND deleted_at IS NULL;
        IF NOT FOUND OR orcamento.status = 'Cancelado' OR NOT orcamento.orcamento_enviado OR orcamento.status_aprovacao <> 'Aprovado' OR orcamento.bloqueio_fabricacao THEN
            RAISE EXCEPTION 'Execução bloqueada: aguarde a aprovação do orçamento pelo cliente.' USING ERRCODE = '23514';
        END IF;
        IF NEW.tipo_servico <> orcamento.tipo_pedido OR (NEW.tipo_servico <> 'Instalacao' AND coalesce(length(trim(orcamento.diagnostico_tecnico)), 0) = 0) THEN
            RAISE EXCEPTION 'Registre o diagnóstico e vincule a OS ao orçamento deste serviço.' USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS proteger_execucao_os ON ordem_servico;
CREATE TRIGGER proteger_execucao_os BEFORE INSERT OR UPDATE ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION proteger_execucao_os();
CREATE OR REPLACE FUNCTION proteger_dados_comerciais() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.orcamento_enviado AND (NEW.cliente_id, NEW.tipo_pedido, NEW.endereco_instalacao, NEW.forma_pagamento, NEW.condicoes_pagamento, NEW.percentual_acrescimo, NEW.diagnostico_tecnico)
        IS DISTINCT FROM (OLD.cliente_id, OLD.tipo_pedido, OLD.endereco_instalacao, OLD.forma_pagamento, OLD.condicoes_pagamento, OLD.percentual_acrescimo, OLD.diagnostico_tecnico) THEN
        RAISE EXCEPTION 'Reabra o orçamento antes de alterar a proposta enviada ao cliente.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS proteger_dados_comerciais ON pedido;
CREATE TRIGGER proteger_dados_comerciais BEFORE UPDATE ON pedido FOR EACH ROW EXECUTE FUNCTION proteger_dados_comerciais();
