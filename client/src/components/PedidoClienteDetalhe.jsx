import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, Typography,
    Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { calcularSubtotalItem, calcularValorTotalPedido, formatarDataBr, formatarMoedaBr } from "../utils/permissoes";

export default function PedidoClienteDetalhe({ pedido, onClose }) {
    if (!pedido) return null;
    return <Dialog open onClose={onClose} fullWidth maxWidth="md" aria-labelledby="detalhe-cliente-title">
        <DialogTitle id="detalhe-cliente-title">Solicitação / Pedido #{pedido.id} — {pedido.tipo_pedido}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={2}>
                <Alert severity="info">Andamento: {pedido.status} • Aprovação comercial: {pedido.status_aprovacao}</Alert>
                <Typography sx={{ whiteSpace: "pre-wrap" }}><strong>Solicitação:</strong> {pedido.descricao_solicitacao || "Não informada"}</Typography>
                <Typography><strong>Endereço:</strong> {pedido.endereco_instalacao || "Não informado"}</Typography>
                {pedido.pedido_origem_id && <Typography>Pedido de origem: #{pedido.pedido_origem_id}</Typography>}
                <Typography><strong>Técnico responsável:</strong> {pedido.responsavel_producao?.nome_completo || "Aguardando atribuição"}</Typography>
                <Typography><strong>Previsão:</strong> {formatarDataBr(pedido.data_previsao_fim)}</Typography>
                {pedido.diagnostico_tecnico && <Typography sx={{ whiteSpace: "pre-wrap" }}><strong>Avaliação técnica:</strong> {pedido.diagnostico_tecnico}</Typography>}
                <Divider />
                <Typography variant="h6">Proposta comercial</Typography>
                <Table size="small" aria-label="Itens da proposta">
                    <TableHead><TableRow><TableCell>Item</TableCell><TableCell>Quantidade</TableCell><TableCell>Valor unitário</TableCell><TableCell>Subtotal</TableCell></TableRow></TableHead>
                    <TableBody>{(pedido.itens || []).map((item) => <TableRow key={item.id}>
                        <TableCell>{item.item_catalogo?.descricao || "Serviço / Item"}</TableCell><TableCell>{item.quantidade}</TableCell>
                        <TableCell>{formatarMoedaBr(item.valor_unitario)}</TableCell><TableCell>{formatarMoedaBr(calcularSubtotalItem(item))}</TableCell>
                    </TableRow>)}</TableBody>
                </Table>
                <Typography>Custo dos itens: {formatarMoedaBr(pedido.custo_total)} • Acréscimo: {pedido.percentual_acrescimo}%</Typography>
                <Typography fontWeight="bold">Total: {formatarMoedaBr(calcularValorTotalPedido(pedido))}</Typography>
                <Typography>Forma de pagamento: {pedido.forma_pagamento || "A combinar"}</Typography>
                <Typography>Condições: {pedido.condicoes_pagamento || "A combinar"}</Typography>
                {pedido.numero_serie && <Typography>Série: {pedido.numero_serie} • Garantia até {formatarDataBr(pedido.fim_garantia)}</Typography>}
                {pedido.motivo_bloqueio && <Alert severity="warning">{pedido.motivo_bloqueio}</Alert>}
            </Stack>
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Fechar</Button></DialogActions>
    </Dialog>;
}
