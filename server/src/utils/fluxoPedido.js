function ehManutencao(pedido) { return ["Manutencao Corretiva", "Manutencao Preventiva"].includes(pedido.tipo_pedido); }
function avaliacaoAprovada(pedido) {
    if (ehManutencao(pedido)) return Boolean(pedido.diagnostico_tecnico?.trim());
    const cm = pedido.checklist_medicao;
    return Boolean(cm && cm.status_aprovacao === "Aprovado" && cm.viga_ok !== false && cm.piso_ok !== false && cm.ponto_eletrico_ok !== false);
}
function exigirLiberacao(pedido) {
    if (!pedido || pedido.status === "Cancelado" || pedido.status_aprovacao !== "Aprovado" || pedido.orcamento_enviado !== true || pedido.bloqueio_fabricacao !== false || !avaliacaoAprovada(pedido)) {
        throw Object.assign(new Error("Execução bloqueada: registre a avaliação técnica e aguarde a aprovação do orçamento pelo cliente."), { status: 400 });
    }
}
module.exports = { ehManutencao, avaliacaoAprovada, exigirLiberacao };
