import { useMemo, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    LinearProgress,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { formatarDataBr, formatarHoraBr } from "../../utils/permissoes";

const ETAPAS_PROGRESSO = {
    Rascunho: 5,
    Pendente: 10,
    Aguardando: 20,
    Planejada: 35,
    "Em Fabricacao": 55,
    Montagem: 70,
    Testes: 85,
    "Pronto para Instalacao": 95,
    Concluido: 100,
};

const ORDEM_ETAPAS = [
    "Aguardando",
    "Planejada",
    "Em Fabricacao",
    "Montagem",
    "Testes",
    "Pronto para Instalacao",
];

export default function LevantamentoOperacional({
    pedidos = [],
    itensEstoque = [],
    alertasEstoque = [],
    ordensServico = [],
    onSelecionarEvento,
}) {
    const [filtroEtapa, setFiltroEtapa] = useState("TODAS");
    const [abaEstoque, setAbaEstoque] = useState(0);

    const pedidosAtivos = useMemo(
        () => pedidos.filter((p) => !["Concluido", "Cancelado"].includes(p.status)),
        [pedidos]
    );

    const contagemPorEtapa = useMemo(() => {
        const mapa = {};
        for (const p of pedidosAtivos) {
            mapa[p.status] = (mapa[p.status] || 0) + 1;
        }
        return mapa;
    }, [pedidosAtivos]);

    const pedidosFiltrados = useMemo(() => {
        if (filtroEtapa === "TODAS") return pedidosAtivos;
        if (filtroEtapa === "BLOQUEADOS") return pedidosAtivos.filter((p) => p.bloqueio_fabricacao);
        return pedidosAtivos.filter((p) => p.status === filtroEtapa);
    }, [pedidosAtivos, filtroEtapa]);

    const osAbertas = useMemo(
        () => ordensServico.filter((os) => ["Aberta", "Em Andamento"].includes(os.status_os)),
        [ordensServico]
    );

    const listaEstoqueExibida = abaEstoque === 0 ? alertasEstoque : itensEstoque;

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} lg={7}>
                <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Pedidos em Andamento ({pedidosAtivos.length})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Clique em um pedido para ver detalhes
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                            <Chip
                                size="small"
                                label={`Todos (${pedidosAtivos.length})`}
                                color={filtroEtapa === "TODAS" ? "primary" : "default"}
                                onClick={() => setFiltroEtapa("TODAS")}
                            />
                            <Chip
                                size="small"
                                icon={<LockIcon />}
                                label={`Bloqueados (${pedidosAtivos.filter((p) => p.bloqueio_fabricacao).length})`}
                                color={filtroEtapa === "BLOQUEADOS" ? "error" : "default"}
                                variant={filtroEtapa === "BLOQUEADOS" ? "filled" : "outlined"}
                                onClick={() => setFiltroEtapa("BLOQUEADOS")}
                            />
                            {ORDEM_ETAPAS.map((etapa) => {
                                const qtd = contagemPorEtapa[etapa] || 0;
                                if (qtd === 0) return null;
                                return (
                                    <Chip
                                        key={etapa}
                                        size="small"
                                        label={`${etapa} (${qtd})`}
                                        color={filtroEtapa === etapa ? "primary" : "default"}
                                        variant={filtroEtapa === etapa ? "filled" : "outlined"}
                                        onClick={() => setFiltroEtapa(etapa)}
                                    />
                                );
                            })}
                        </Stack>

                        {pedidosFiltrados.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                                Nenhum pedido encontrado para o filtro selecionado.
                            </Typography>
                        ) : (
                            <List dense disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
                                {pedidosFiltrados.map((p) => {
                                    const nomeCliente = p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
                                    const progresso = ETAPAS_PROGRESSO[p.status] || 15;
                                    return (
                                        <ListItemButton
                                            key={p.id}
                                            divider
                                            onClick={() => onSelecionarEvento?.("pedido", p)}
                                            sx={{ borderRadius: 1 }}
                                        >
                                            <Box sx={{ width: "100%" }}>
                                                <Stack
                                                    direction={{ xs: "column", sm: "row" }}
                                                    justifyContent="space-between"
                                                    alignItems={{ xs: "flex-start", sm: "center" }}
                                                    spacing={1}
                                                >
                                                    <Typography variant="body2" fontWeight="bold">
                                                        Pedido #{p.id} — {nomeCliente}
                                                    </Typography>
                                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                                        {p.bloqueio_fabricacao && (
                                                            <Tooltip title={p.motivo_bloqueio || "Bloqueado para fabricação"}>
                                                                <Chip
                                                                    size="small"
                                                                    icon={<LockIcon />}
                                                                    color="error"
                                                                    label="Bloqueado"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                        <Chip
                                                            size="small"
                                                            color={p.status === "Pronto para Instalacao" ? "success" : "primary"}
                                                            variant="outlined"
                                                            label={p.status}
                                                        />
                                                    </Stack>
                                                </Stack>

                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    <Typography variant="caption" color="text.secondary">
                                                        Aprovação: {p.status_aprovacao} • Tipo: {p.tipo_pedido}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Previsão: {formatarDataBr(p.data_previsao_fim)}
                                                    </Typography>
                                                </Stack>

                                                <LinearProgress
                                                    variant="determinate"
                                                    value={progresso}
                                                    color={p.bloqueio_fabricacao ? "warning" : "primary"}
                                                    sx={{ mt: 0.75, height: 6, borderRadius: 3 }}
                                                />
                                            </Box>
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
                <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Situação do Estoque
                            </Typography>
                            <Chip
                                size="small"
                                variant="outlined"
                                color={alertasEstoque.length > 0 ? "error" : "success"}
                                label={`${itensEstoque.length} itens`}
                            />
                        </Stack>

                        <Tabs value={abaEstoque} onChange={(_, v) => setAbaEstoque(v)} sx={{ mb: 1.5 }}>
                            <Tab label={`Alertas (${alertasEstoque.length})`} />
                            <Tab label={`Catálogo (${itensEstoque.length})`} />
                        </Tabs>

                        {listaEstoqueExibida.length === 0 ? (
                            <Stack alignItems="center" spacing={1} sx={{ py: 4 }}>
                                <CheckCircleIcon color="success" />
                                <Typography variant="body2" color="text.secondary" align="center">
                                    {abaEstoque === 0
                                        ? "Nenhum item abaixo do estoque mínimo."
                                        : "Nenhum item cadastrado no catálogo."}
                                </Typography>
                            </Stack>
                        ) : (
                            <List dense disablePadding sx={{ maxHeight: 330, overflowY: "auto" }}>
                                {listaEstoqueExibida.map((item) => {
                                    const critico = Number(item.quantidade_atual) <= Number(item.estoque_minimo);
                                    return (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                py: 1,
                                                px: 1,
                                                borderBottom: "1px solid",
                                                borderColor: "divider",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 1,
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                                {critico ? (
                                                    <WarningAmberIcon color="error" fontSize="small" />
                                                ) : (
                                                    <CheckCircleIcon color="success" fontSize="small" />
                                                )}
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" fontWeight="medium" noWrap>
                                                        {item.codigo_referencia ? `[${item.codigo_referencia}] ` : ""}
                                                        {item.descricao}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.tipo?.nome || "-"} • Mínimo: {item.estoque_minimo}{" "}
                                                        {item.unidade_medida}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Chip
                                                size="small"
                                                color={critico ? "error" : "default"}
                                                label={`${item.quantidade_atual} ${item.unidade_medida}`}
                                            />
                                        </Box>
                                    );
                                })}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Ordens de Serviço em Aberto ({osAbertas.length})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Instalações e manutenções em andamento
                            </Typography>
                        </Stack>

                        {osAbertas.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                Nenhuma Ordem de Serviço aberta ou em andamento no momento.
                            </Typography>
                        ) : (
                            <Grid container spacing={1.5}>
                                {osAbertas.slice(0, 6).map((os) => {
                                    const nomeCliente =
                                        os.pedido?.cliente?.usuario?.nome_completo || `Pedido #${os.pedido_id}`;
                                    const nomeTecnico =
                                        os.tecnico_responsavel?.nome_completo ||
                                        (os.tecnico_responsavel_id
                                            ? `Técnico #${os.tecnico_responsavel_id}`
                                            : "Aguardando atribuição");
                                    const hora = formatarHoraBr(os.data_agendamento);
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={os.id}>
                                            <ListItemButton
                                                onClick={() => onSelecionarEvento?.("ordem_servico", os)}
                                                sx={{
                                                    border: "1px solid",
                                                    borderColor: "divider",
                                                    borderRadius: 1.5,
                                                    height: "100%",
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                            <Typography variant="body2" fontWeight="bold">
                                                                OS #{os.id} — {os.tipo_servico}
                                                            </Typography>
                                                            <Chip
                                                                size="small"
                                                                color={os.status_os === "Em Andamento" ? "warning" : "info"}
                                                                label={os.status_os}
                                                            />
                                                        </Stack>
                                                    }
                                                    secondary={
                                                        <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                                                            <Typography variant="caption" color="text.primary">
                                                                Cliente: {nomeCliente}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Técnico: {nomeTecnico}
                                                            </Typography>
                                                            <Stack direction="row" spacing={0.5} alignItems="center">
                                                                <ScheduleIcon sx={{ fontSize: 13 }} color="action" />
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {formatarDataBr(os.data_agendamento)}
                                                                    {hora ? ` às ${hora}` : ""}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    }
                                                />
                                            </ListItemButton>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
