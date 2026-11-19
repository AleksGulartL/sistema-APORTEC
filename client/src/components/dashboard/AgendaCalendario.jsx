import { useMemo, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";
import LockIcon from "@mui/icons-material/Lock";
import {
    extrairChaveDataLocal,
    formatarDataBr,
    formatarHoraBr,
    hojeChaveLocal,
} from "../../utils/permissoes";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TIPOS_EVENTO = [
    { chave: "TODOS", label: "Todos" },
    { chave: "ENTREGA_PEDIDO", label: "Entregas de Pedidos", cor: "primary" },
    { chave: "OS_AGENDADA", label: "Ordens de Serviço", cor: "warning" },
    { chave: "FIM_GARANTIA", label: "Fim de Garantia", cor: "secondary" },
];

export default function AgendaCalendario({ pedidos = [], ordensServico = [], onSelecionarEvento }) {
    const hojeIso = hojeChaveLocal();
    const [mesRef, setMesRef] = useState(() => {
        const agora = new Date();
        return new Date(agora.getFullYear(), agora.getMonth(), 1);
    });
    const [diaSelecionado, setDiaSelecionado] = useState(hojeIso);
    const [filtroTipo, setFiltroTipo] = useState("TODOS");

    const eventosPorData = useMemo(() => {
        const mapa = {};
        const adicionar = (dataIso, evento) => {
            if (!dataIso) return;
            if (filtroTipo !== "TODOS" && evento.tipo !== filtroTipo) return;
            if (!mapa[dataIso]) mapa[dataIso] = [];
            mapa[dataIso].push(evento);
        };

        for (const p of pedidos) {
            const nomeCliente = p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
            if (p.data_previsao_fim && p.status !== "Cancelado") {
                adicionar(extrairChaveDataLocal(p.data_previsao_fim), {
                    id: `ped-${p.id}`,
                    tipo: "ENTREGA_PEDIDO",
                    cor: p.bloqueio_fabricacao ? "error" : "primary",
                    bloqueado: Boolean(p.bloqueio_fabricacao),
                    titulo: `Pedido #${p.id}`,
                    descricaoLista: `Previsão de Entrega — ${nomeCliente} (${p.status})`,
                    badge: p.status,
                    registroTipo: "pedido",
                    registro: p,
                });
            }

            if (p.fim_garantia && p.status !== "Cancelado") {
                adicionar(extrairChaveDataLocal(p.fim_garantia), {
                    id: `gar-${p.id}`,
                    tipo: "FIM_GARANTIA",
                    cor: "secondary",
                    titulo: `Garantia ${p.numero_serie || `#${p.id}`}`,
                    descricaoLista: `Término da garantia — ${nomeCliente}`,
                    badge: "Garantia",
                    registroTipo: "pedido",
                    registro: p,
                });
            }
        }

        for (const os of ordensServico) {
            if (os.data_agendamento && os.status_os !== "Cancelada") {
                const nomeCliente =
                    os.pedido?.cliente?.usuario?.nome_completo || `Pedido #${os.pedido_id}`;
                const nomeTecnico =
                    os.tecnico_responsavel?.nome_completo ||
                    (os.tecnico_responsavel_id ? `Técnico #${os.tecnico_responsavel_id}` : "Sem técnico");
                const hora = formatarHoraBr(os.data_agendamento);
                adicionar(extrairChaveDataLocal(os.data_agendamento), {
                    id: `os-${os.id}`,
                    tipo: "OS_AGENDADA",
                    cor: "warning",
                    titulo: `${hora ? `${hora} ` : ""}OS #${os.id}`,
                    descricaoLista: `${os.tipo_servico} — ${nomeCliente} • ${nomeTecnico}`,
                    badge: os.status_os,
                    registroTipo: "ordem_servico",
                    registro: os,
                });
            }
        }

        return mapa;
    }, [pedidos, ordensServico, filtroTipo]);

    const gradeMensal = useMemo(() => {
        const ano = mesRef.getFullYear();
        const mes = mesRef.getMonth();
        const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
        const ultimoDia = new Date(ano, mes + 1, 0).getDate();

        const celulas = [];
        for (let i = 0; i < primeiroDiaSemana; i++) {
            celulas.push(null);
        }
        for (let dia = 1; dia <= ultimoDia; dia++) {
            const iso = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            celulas.push({ dia, iso });
        }
        return celulas;
    }, [mesRef]);

    function irParaHoje() {
        const agora = new Date();
        setMesRef(new Date(agora.getFullYear(), agora.getMonth(), 1));
        setDiaSelecionado(hojeIso);
    }

    function mudarMes(delta) {
        setMesRef((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    }

    const eventosDoDia = eventosPorData[diaSelecionado] || [];
    const totalEventosMes = useMemo(() => {
        const prefixo = `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, "0")}`;
        return Object.entries(eventosPorData).reduce(
            (acc, [data, evs]) => (data.startsWith(prefixo) ? acc + evs.length : acc),
            0
        );
    }, [eventosPorData, mesRef]);

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} lg={8}>
                <Card elevation={2} sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1.5}
                            sx={{ mb: 2 }}
                        >
                            <Stack direction="row" spacing={1} alignItems="center">
                                <EventIcon color="primary" />
                                <Typography variant="h6" fontWeight="bold" sx={{ textTransform: "capitalize" }}>
                                    {mesRef.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                                </Typography>
                                <Chip size="small" variant="outlined" label={`${totalEventosMes} no mês`} />
                            </Stack>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <Button size="small" variant="outlined" startIcon={<TodayIcon />} onClick={irParaHoje}>
                                    Hoje
                                </Button>
                                <Tooltip title="Mês anterior">
                                    <IconButton size="small" onClick={() => mudarMes(-1)}>
                                        <ChevronLeftIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Próximo mês">
                                    <IconButton size="small" onClick={() => mudarMes(1)}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                            {TIPOS_EVENTO.map((t) => (
                                <Chip
                                    key={t.chave}
                                    size="small"
                                    label={t.label}
                                    color={filtroTipo === t.chave ? t.cor || "primary" : "default"}
                                    variant={filtroTipo === t.chave ? "filled" : "outlined"}
                                    onClick={() => setFiltroTipo(t.chave)}
                                />
                            ))}
                        </Stack>

                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75, mb: 0.75 }}>
                            {DIAS_SEMANA.map((diaNome) => (
                                <Typography
                                    key={diaNome}
                                    variant="caption"
                                    fontWeight="bold"
                                    align="center"
                                    color="text.secondary"
                                >
                                    {diaNome}
                                </Typography>
                            ))}
                        </Box>

                        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75 }}>
                            {gradeMensal.map((celula, idx) => {
                                if (!celula) {
                                    return <Box key={`vazio-${idx}`} sx={{ minHeight: { xs: 56, sm: 82 } }} />;
                                }
                                const eventos = eventosPorData[celula.iso] || [];
                                const ehHoje = celula.iso === hojeIso;
                                const selecionado = celula.iso === diaSelecionado;

                                return (
                                    <Box
                                        key={celula.iso}
                                        onClick={() => setDiaSelecionado(celula.iso)}
                                        sx={{
                                            minHeight: { xs: 56, sm: 82 },
                                            p: 0.75,
                                            borderRadius: 1.5,
                                            cursor: "pointer",
                                            border: selecionado
                                                ? "2px solid #0f3460"
                                                : ehHoje
                                                  ? "1.5px solid #ff9800"
                                                  : "1px solid #e0e0e0",
                                            bgcolor: selecionado
                                                ? "rgba(15, 52, 96, 0.08)"
                                                : ehHoje
                                                  ? "rgba(255, 152, 0, 0.07)"
                                                  : "background.paper",
                                            transition: "background-color 0.15s",
                                            "&:hover": { bgcolor: "action.hover" },
                                            overflow: "hidden",
                                        }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography
                                                variant="caption"
                                                fontWeight={ehHoje || selecionado ? "bold" : "medium"}
                                                color={ehHoje ? "secondary.dark" : "text.primary"}
                                            >
                                                {celula.dia}
                                            </Typography>
                                            {eventos.length > 0 && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        fontSize: "0.65rem",
                                                        fontWeight: "bold",
                                                        color: "primary.main",
                                                    }}
                                                >
                                                    {eventos.length}
                                                </Typography>
                                            )}
                                        </Stack>

                                        <Stack spacing={0.35} sx={{ mt: 0.4, display: { xs: "none", sm: "flex" } }}>
                                            {eventos.slice(0, 2).map((ev) => (
                                                <Chip
                                                    key={ev.id}
                                                    size="small"
                                                    color={ev.cor}
                                                    icon={ev.bloqueado ? <LockIcon /> : undefined}
                                                    label={ev.titulo}
                                                    sx={{
                                                        height: 18,
                                                        fontSize: "0.65rem",
                                                        justifyContent: "flex-start",
                                                        "& .MuiChip-label": {
                                                            px: 0.6,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        },
                                                    }}
                                                />
                                            ))}
                                            {eventos.length > 2 && (
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                                                    +{eventos.length - 2} mais
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
                <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                    <CardContent>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Agenda de {formatarDataBr(diaSelecionado)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                            {eventosDoDia.length === 0
                                ? "Nenhum evento agendado para este dia."
                                : `${eventosDoDia.length} compromisso(s) programado(s). Clique para detalhes:`}
                        </Typography>
                        <Divider sx={{ mb: 1 }} />

                        {eventosDoDia.length > 0 && (
                            <List dense disablePadding>
                                {eventosDoDia.map((ev) => (
                                    <ListItemButton
                                        key={ev.id}
                                        divider
                                        onClick={() => onSelecionarEvento?.(ev.registroTipo, ev.registro)}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {ev.titulo}
                                                    </Typography>
                                                    <Chip size="small" color={ev.cor} label={ev.badge} />
                                                </Stack>
                                            }
                                            secondary={ev.descricaoLista}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
}
