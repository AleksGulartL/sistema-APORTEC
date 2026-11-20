CREATE OR REPLACE FUNCTION validar_atribuicao_tecnico() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE tecnico_id BIGINT;
BEGIN
    IF TG_OP = 'UPDATE' AND (to_jsonb(NEW)->>TG_ARGV[0]) IS NOT DISTINCT FROM (to_jsonb(OLD)->>TG_ARGV[0]) THEN
        RETURN NEW;
    END IF;
    tecnico_id := (to_jsonb(NEW)->>TG_ARGV[0])::BIGINT;
    IF tecnico_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM usuario WHERE id = tecnico_id AND perfil = 'TECNICO' AND ativo AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'O responsável deve ser um técnico ativo.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validar_tecnico_pedido ON pedido;
CREATE TRIGGER validar_tecnico_pedido BEFORE INSERT OR UPDATE OF responsavel_producao_id ON pedido
FOR EACH ROW EXECUTE FUNCTION validar_atribuicao_tecnico('responsavel_producao_id');
DROP TRIGGER IF EXISTS validar_tecnico_os ON ordem_servico;
CREATE TRIGGER validar_tecnico_os BEFORE INSERT OR UPDATE OF tecnico_responsavel_id ON ordem_servico
FOR EACH ROW EXECUTE FUNCTION validar_atribuicao_tecnico('tecnico_responsavel_id');
