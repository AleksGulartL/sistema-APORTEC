function obterPendenciasOrcamento(pedido) {
    const pendencias = [];
    if (pedido.status === "Rascunho") pendencias.push("Encaminhe o rascunho para avaliação.");
    if (!pedido.responsavel_producao_id) pendencias.push("Atribua um técnico responsável.");
    const manutencao = ["Manutencao Preventiva", "Manutencao Corretiva"].includes(pedido.tipo_pedido);
    if (manutencao ? !pedido.diagnostico_tecnico?.trim() : !pedido.checklist_medicao?.medidas_vao?.trim()) {
        pendencias.push(manutencao ? "Aguarde o técnico registrar o diagnóstico." : "Aguarde o técnico preencher o checklist de medição.");
    }
    if (!pedido.itens?.length) pendencias.push("Adicione os itens do levantamento ao orçamento.");
    else if (!Number.isFinite(Number(pedido.custo_total)) || Number(pedido.custo_total) <= 0) {
        pendencias.push("Informe itens com custo total maior que zero.");
    }
    return pendencias;
}

module.exports = { obterPendenciasOrcamento };
