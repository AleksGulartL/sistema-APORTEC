-- Chamados antigos ainda abertos entram no mesmo fluxo sem perder seu ID nem a porta de origem.
DO $$
DECLARE chamado RECORD; nova_solicitacao BIGINT;
BEGIN
    FOR chamado IN
        SELECT os.id, os.pedido_id, os.tipo_servico, os.tecnico_responsavel_id, os.descricao_problema,
               p.cliente_id, p.endereco_instalacao
        FROM ordem_servico os JOIN pedido p ON p.id = os.pedido_id
        WHERE os.status_os = 'Aberta' AND os.deleted_at IS NULL AND p.deleted_at IS NULL
          AND os.tipo_servico IN ('Manutencao Corretiva', 'Manutencao Preventiva')
          AND os.tipo_servico <> p.tipo_pedido
    LOOP
        INSERT INTO pedido (cliente_id, usuario_criador_id, responsavel_producao_id, pedido_origem_id,
                            tipo_pedido, descricao_solicitacao, endereco_instalacao, status, motivo_bloqueio)
        VALUES (chamado.cliente_id, chamado.cliente_id,
                (SELECT id FROM usuario WHERE id = chamado.tecnico_responsavel_id AND perfil = 'TECNICO' AND ativo AND deleted_at IS NULL),
                chamado.pedido_id, chamado.tipo_servico, coalesce(chamado.descricao_problema, 'Solicitação de manutenção'),
                chamado.endereco_instalacao, 'Recebida', 'Aguardando avaliação técnica e aprovação do orçamento de manutenção.')
        RETURNING id INTO nova_solicitacao;
        UPDATE ordem_servico SET pedido_id = nova_solicitacao, updated_at = CURRENT_TIMESTAMP WHERE id = chamado.id;
    END LOOP;
END;
$$;
