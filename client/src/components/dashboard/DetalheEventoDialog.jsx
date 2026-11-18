import {
    Alert,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { formatarDataBr, formatarHoraBr, formatarMoedaBr } from "../../utils/permissoes";

function CampoInfo({ label, valor }) {
    return (
        <Grid item xs={12} sm={6}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight="medium">
                {valor || "-"}
            </Typography>
        </Grid>
    );
}

export default function DetalheEventoDialog({ selecionado, onClose, onAbrirPedido }) {
    if (!selecionado) return null;
    const { tipo, registro } = selecionado;

    const ehPedido = tipo === "pedido";
    const nomeCliente = registro.cliente?.usuario?.nome_completo || `Cliente #${registro.cliente_id}`;

    return (
        <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                        {ehPedido
                            ? `Pedido #${registro.codigo_proposta || registro.id}`
                            : `Ordem de Serviço #${registro.id}`}
                    </Typography>
                    <Chip
                        size="small"
                        color="primary"
                        label={ehPedido ? registro.status : registro.status_os}
                    />
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                {ehPedido ? (
                    <Stack spacing={2}>
                        {registro.bloqueio_fabricacao && (
                            <Alert severity="warning">
                                {registro.motivo_bloqueio || "Bloqueado para liberação de produção."}
                            </Alert>
                        )}

                        <Grid container spacing={1.5}>
                            <CampoInfo label="Cliente" valor={nomeCliente} />
                            <CampoInfo label="Telefone" valor={registro.cliente?.telefone} />
                            <CampoInfo label="Tipo do Pedido" valor={registro.tipo_pedido} />
                            <CampoInfo label="Aprovação Comercial" valor={registro.status_aprovacao} />
                            <CampoInfo
                                label="Endereço de Instalação"
                                valor={registro.endereco_instalacao || registro.cliente?.endereco}
                            />
                            <CampoInfo label="Valor Total" valor={formatarMoedaBr(registro.valor_total)} />
                            <CampoInfo label="Previsão de Entrega" valor={formatarDataBr(registro.data_previsao_fim)} />
                            <CampoInfo label="Nº Série da Porta" valor={registro.numero_serie_porta} />
                            <CampoInfo label="Fim da Garantia" valor={formatarDataBr(registro.fim_garantia)} />
                            <CampoInfo
                                label="Checklist de Medição"
                                valor={
                                    registro.checklist_medicao
                                        ? `${registro.checklist_medicao.status_aprovacao} (${registro.checklist_medicao.medidas_vao})`
                                        : "Ainda não preenchido"
                                }
                            />
                        </Grid>

                        {Array.isArray(registro.itens) && registro.itens.length > 0 && (
                            <>
                                <Divider />
                                <Typography variant="subtitle2" fontWeight="bold">
                                    Itens do Pedido ({registro.itens.length})
                                </Typography>
                                <List dense disablePadding>
                                    {registro.itens.map((item) => (
                                        <ListItem key={item.id} divider>
                                            <ListItemText
                                                primary={item.item_catalogo?.descricao || `Item #${item.item_id}`}
                                                secondary={`Qtd: ${item.quantidade} • Total: ${formatarMoedaBr(item.valor_total)}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}
                    </Stack>
                ) : (
                    <Grid container spacing={1.5}>
                        <CampoInfo label="Cliente" valor={nomeCliente} />
                        <CampoInfo
                            label="Técnico Responsável"
                            valor={
                                registro.tecnico_responsavel?.nome_completo ||
                                (registro.tecnico_responsavel_id
                                    ? `Técnico #${registro.tecnico_responsavel_id}`
                                    : "Aguardando atribuição")
                            }
                        />
                        <CampoInfo label="Tipo de Serviço" valor={registro.tipo_servico} />
                        <CampoInfo label="Cobertura" valor={registro.origem_cobertura} />
                        <CampoInfo
                            label="Agendamento"
                            valor={
                                registro.data_agendamento
                                    ? `${formatarDataBr(registro.data_agendamento)}${
                                          formatarHoraBr(registro.data_agendamento)
                                              ? ` às ${formatarHoraBr(registro.data_agendamento)}`
                                              : ""
                                      }`
                                    : "-"
                            }
                        />
                        <CampoInfo label="Conclusão" valor={formatarDataBr(registro.data_conclusao)} />
                        <CampoInfo label="Descrição do Problema" valor={registro.descricao_problema} />
                        <CampoInfo label="Parecer Técnico" valor={registro.parecer_tecnico} />
                    </Grid>
                )}
            </DialogContent>

            <DialogActions>
                {ehPedido && onAbrirPedido && (
                    <Button
                        variant="contained"
                        startIcon={<OpenInNewIcon />}
                        onClick={() => {
                            const id = registro.id;
                            onClose?.();
                            onAbrirPedido(id);
                        }}
                    >
                        Abrir Detalhes do Pedido
                    </Button>
                )}
                <Button onClick={onClose} startIcon={<CloseIcon />}>
                    Fechar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
