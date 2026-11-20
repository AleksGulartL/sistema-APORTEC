-- Uma única assinatura na OS encerra o serviço e seu pedido, atomicamente.
-- Não altera nem reassina ordens históricas já finalizadas.
CREATE OR REPLACE FUNCTION proteger_execucao_os() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE orcamento pedido%ROWTYPE;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status_os = 'Finalizada' THEN
        RAISE EXCEPTION 'Esta OS já foi finalizada e não pode ser alterada.' USING ERRCODE = '23514';
    END IF;
    SELECT * INTO orcamento FROM pedido WHERE id = NEW.pedido_id AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado.' USING ERRCODE = '23503'; END IF;
    IF orcamento.status IN ('Cancelado', 'Concluido') THEN
        RAISE EXCEPTION 'O pedido vinculado já está encerrado.' USING ERRCODE = '23514';
    END IF;
    IF NEW.tipo_servico <> orcamento.tipo_pedido THEN
        RAISE EXCEPTION 'O tipo da OS deve corresponder ao pedido vinculado.' USING ERRCODE = '23514';
    END IF;
    IF NEW.status_os IN ('Em Andamento', 'Finalizada') THEN
        IF NOT orcamento.orcamento_enviado OR orcamento.status_aprovacao <> 'Aprovado' OR orcamento.bloqueio_fabricacao THEN
            RAISE EXCEPTION 'Execução bloqueada: aguarde a aprovação do orçamento pelo cliente.' USING ERRCODE = '23514';
        END IF;
        IF NEW.tipo_servico <> 'Instalacao' AND coalesce(length(trim(orcamento.diagnostico_tecnico)), 0) = 0 THEN
            RAISE EXCEPTION 'Registre o diagnóstico técnico antes do atendimento.' USING ERRCODE = '23514';
        END IF;
    END IF;
    IF NEW.status_os = 'Finalizada' THEN
        IF TG_OP = 'UPDATE' AND OLD.status_os = 'Cancelada' THEN
            RAISE EXCEPTION 'Uma OS cancelada não pode ser finalizada.' USING ERRCODE = '23514';
        END IF;
        IF coalesce(length(trim(NEW.parecer_tecnico)), 0) = 0 OR coalesce(length(trim(NEW.assinatura_cliente_digital)), 0) = 0 THEN
            RAISE EXCEPTION 'Informe o parecer técnico e a assinatura do cliente para finalizar.' USING ERRCODE = '23514';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM usuario WHERE id = NEW.tecnico_responsavel_id AND perfil = 'TECNICO' AND ativo AND deleted_at IS NULL) THEN
            RAISE EXCEPTION 'Atribua um técnico ativo antes de finalizar a OS.' USING ERRCODE = '23514';
        END IF;
        IF NEW.tipo_servico = 'Instalacao' AND (orcamento.status <> 'Pronto para Instalacao' OR NOT EXISTS (
            SELECT 1 FROM checklist_medicao WHERE pedido_id = orcamento.id AND deleted_at IS NULL
                AND status_aprovacao = 'Aprovado' AND viga_ok AND piso_ok AND ponto_eletrico_ok
        )) THEN
            RAISE EXCEPTION 'Conclua a produção e aprove a medição antes de finalizar a instalação.' USING ERRCODE = '23514';
        END IF;
        NEW.data_conclusao := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION proteger_exclusao_os_finalizada() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status_os = 'Finalizada' THEN
        RAISE EXCEPTION 'Uma OS finalizada não pode ser excluída.' USING ERRCODE = '23514';
    END IF;
    RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS proteger_exclusao_os_finalizada ON ordem_servico;
CREATE TRIGGER proteger_exclusao_os_finalizada BEFORE DELETE ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION proteger_exclusao_os_finalizada();

CREATE OR REPLACE FUNCTION proteger_conclusao_pedido() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = 'Concluido' THEN
        IF (NEW.status, NEW.assinatura_cliente_instalacao, NEW.numero_serie, NEW.fim_garantia, NEW.data_conclusao)
            IS DISTINCT FROM (OLD.status, OLD.assinatura_cliente_instalacao, OLD.numero_serie, OLD.fim_garantia, OLD.data_conclusao) THEN
            RAISE EXCEPTION 'O encerramento deste pedido já foi registrado e não pode ser refeito.' USING ERRCODE = '23514';
        END IF;
    ELSIF NEW.status = 'Concluido' AND NOT EXISTS (
        SELECT 1 FROM ordem_servico WHERE pedido_id = NEW.id AND deleted_at IS NULL AND status_os = 'Finalizada'
            AND assinatura_cliente_digital = NEW.assinatura_cliente_instalacao AND data_conclusao = NEW.data_conclusao
    ) THEN
        RAISE EXCEPTION 'Finalize a OS com parecer e assinatura para concluir este pedido.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS proteger_conclusao_pedido ON pedido;
CREATE TRIGGER proteger_conclusao_pedido BEFORE UPDATE ON pedido
FOR EACH ROW EXECUTE FUNCTION proteger_conclusao_pedido();

CREATE OR REPLACE FUNCTION concluir_pedido_pela_os() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status_os = 'Finalizada' THEN
        UPDATE pedido SET status = 'Concluido', assinatura_cliente_instalacao = NEW.assinatura_cliente_digital,
            data_conclusao = NEW.data_conclusao, updated_at = CURRENT_TIMESTAMP,
            numero_serie = CASE WHEN tipo_pedido = 'Instalacao' THEN coalesce(numero_serie,
                'APORTEC-' || to_char(NEW.data_conclusao, 'YYYY') || '-' || lpad(id::text, greatest(4, length(id::text)), '0')) ELSE numero_serie END,
            fim_garantia = CASE WHEN tipo_pedido = 'Instalacao' THEN coalesce(fim_garantia,
                (NEW.data_conclusao::date + INTERVAL '1 year')::date) ELSE fim_garantia END
        WHERE id = NEW.pedido_id;
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS concluir_pedido_pela_os ON ordem_servico;
CREATE TRIGGER concluir_pedido_pela_os AFTER INSERT OR UPDATE OF status_os ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION concluir_pedido_pela_os();
