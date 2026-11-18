import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SensorDoorIcon from "@mui/icons-material/SensorDoor";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../services/api";
import {
    calcularSituacaoGarantia,
    formatarDataBr,
    formatarDataHoraBr,
    formatarMoedaBr,
} from "../utils/permissoes";
import { VisualizarAssinatura } from "./comum/AssinaturaDigital";

const ETAPAS_CLIENTE = [
    "Pendente",
    "Aguardando",
    "Planejada",
    "Em Fabricacao",
    "Montagem",
    "Testes",
    "Pronto para Instalacao",
    "Concluido",
];

const COR_STATUS_OS = {
    Aberta: "info",
    "Em Andamento": "warning",
    Finalizada: "success",
    Cancelada: "error",
};

export default function PortalCliente({ usuario, secao = "cliente_inicio", onMudarSecao }) {
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");
    const [dadosCliente, setDadosCliente] = useState(null);
    const [pedidos, setPedidos] = useState([]);
    const [ordensServico, setOrdensServico] = useState([]);

    // Confirmação de aprovação/reprovação de orçamento
    const [decisaoOrcamento, setDecisaoOrcamento] = useState(null);
    const [salvandoDecisao, setSalvandoDecisao] = useState(false);

    // Modal abrir chamado de manutenção
    const [modalOsAberto, setModalOsAberto] = useState(false);
    const [formOs, setFormOs] = useState({
        pedido_id: "",
        tipo_servico: "Manutencao Corretiva",
        descricao_problema: "",
    });
    const [erroOs, setErroOs] = useState("");
    const [salvandoOs, setSalvandoOs] = useState(false);

    const carregarResumo = useCallback(async () => {
        setCarregando(true);
        setErro("");
        try {
            const res = await api.get("/portal-cliente/resumo");
            setDadosCliente(res.data?.cliente || null);
            setPedidos(Array.isArray(res.data?.pedidos) ? res.data.pedidos : []);
            setOrdensServico(Array.isArray(res.data?.ordens_servico) ? res.data.ordens_servico : []);
        } catch (err) {
            console.error("Erro ao carregar portal do cliente:", err);
            setErro(err.response?.data?.erro || "Não foi possível carregar seus dados do portal.");
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => {
        carregarResumo();
    }, [carregarResumo]);

    const orcamentosPendentes = useMemo(
        () => pedidos.filter((p) => p.status_aprovacao === "Pendente" && p.status !== "Cancelado"),
        [pedidos]
    );

    const pedidosAtivos = useMemo(
        () => pedidos.filter((p) => !["Concluido", "Cancelado"].includes(p.status)),
        [pedidos]
    );

    const portasInstaladas = useMemo(
        () => pedidos.filter((p) => Boolean(p.numero_serie_porta) || p.status === "Concluido"),
        [pedidos]
    );

    const osAbertas = useMemo(
        () => ordensServico.filter((os) => ["Aberta", "Em Andamento"].includes(os.status_os)),
        [ordensServico]
    );

    const pendenciasObra = useMemo(
        () =>
            pedidosAtivos.filter((p) => {
                const cm = p.checklist_medicao;
                return cm && (cm.viga_ok === false || cm.piso_ok === false || cm.ponto_eletrico_ok === false);
            }),
        [pedidosAtivos]
    );

    async function confirmarDecisaoOrcamento() {
        if (!decisaoOrcamento) return;
        setSalvandoDecisao(true);
        setErro("");
        try {
            await api.patch(`/portal-cliente/pedidos/${decisaoOrcamento.pedido.id}/aprovacao`, {
                status_aprovacao: decisaoOrcamento.decisao,
            });
            setSucessoMsg(
                decisaoOrcamento.decisao === "Aprovado"
                    ? `Orçamento #${decisaoOrcamento.pedido.codigo_proposta || decisaoOrcamento.pedido.id} aprovado com sucesso!`
                    : `Orçamento #${decisaoOrcamento.pedido.codigo_proposta || decisaoOrcamento.pedido.id} marcado como reprovado.`
            );
            setDecisaoOrcamento(null);
            carregarResumo();
        } catch (err) {
            console.error("Erro ao responder orçamento:", err);
            setErro(err.response?.data?.erro || "Não foi possível registrar sua resposta.");
            setDecisaoOrcamento(null);
        } finally {
            setSalvandoDecisao(false);
        }
    }

    function abrirNovaSolicitacao(pedidoPreSelecionado = null) {
        setFormOs({
            pedido_id: pedidoPreSelecionado ? String(pedidoPreSelecionado.id) : "",
            tipo_servico: "Manutencao Corretiva",
            descricao_problema: "",
        });
        setErroOs("");
        setModalOsAberto(true);
    }

    async function enviarSolicitacaoOs(event) {
        event.preventDefault();
        setErroOs("");

        if (!formOs.descricao_problema.trim()) {
            setErroOs("Descreva o problema ou o serviço desejado.");
            return;
        }

        setSalvandoOs(true);
        try {
            await api.post("/portal-cliente/ordens-servico", {
                pedido_id: formOs.pedido_id ? Number(formOs.pedido_id) : null,
                tipo_servico: formOs.tipo_servico,
                descricao_problema: formOs.descricao_problema.trim(),
            });
            setSucessoMsg("Solicitação de atendimento enviada! Nossa equipe entrará em contato para agendar.");
            setModalOsAberto(false);
            carregarResumo();
        } catch (err) {
            console.error("Erro ao abrir solicitação de OS:", err);
            setErroOs(err.response?.data?.erro || "Erro ao registrar solicitação de atendimento.");
        } finally {
            setSalvandoOs(false);
        }
    }

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    const nomeCliente = dadosCliente?.usuario?.nome_completo || usuario?.nome_completo || "Cliente";

    return (
        <Box sx={{ py: 3 }}>
            {/* Cabeçalho */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        {secao === "cliente_inicio" && `Olá, ${nomeCliente}`}
                        {secao === "cliente_pedidos" && "Meus Pedidos e Orçamentos"}
                        {secao === "cliente_portas" && "Minhas Portas e Garantias"}
                        {secao === "cliente_os" && "Assistência Técnica e Chamados"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {secao === "cliente_inicio" &&
                            "Acompanhe o andamento dos seus projetos, aprovações pendentes, portas instaladas e chamados"}
                        {secao === "cliente_pedidos" &&
                            "Consulte propostas comerciais, aprove orçamentos e acompanhe a etapa de fabricação"}
                        {secao === "cliente_portas" &&
                            "Consulte o número de série, especificações técnicas e vigência da garantia das suas portas"}
                        {secao === "cliente_os" &&
                            "Acompanhe suas visitas técnicas agendadas ou solicite manutenção"}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={carregarResumo}>
                        Atualizar
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddIcon />}
                        onClick={() => abrirNovaSolicitacao()}
                    >
                        Solicitar Manutenção
                    </Button>
                </Stack>
            </Stack>

            {sucessoMsg && (
                <Alert severity="success" onClose={() => setSucessoMsg("")} sx={{ mb: 2 }}>
                    {sucessoMsg}
                </Alert>
            )}
            {erro && (
                <Alert severity="error" onClose={() => setErro("")} sx={{ mb: 2 }}>
                    {erro}
                </Alert>
            )}

            {/* ==================== VISÃO 1: INÍCIO ==================== */}
            {secao === "cliente_inicio" && (
                <Stack spacing={3}>
                    {orcamentosPendentes.length > 0 && (
                        <Alert
                            severity="info"
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => onMudarSecao?.("cliente_pedidos")}
                                >
                                    Revisar Agora
                                </Button>
                            }
                        >
                            Você possui <strong>{orcamentosPendentes.length} orçamento(s)</strong> aguardando sua
                            aprovação para iniciar a fabricação.
                        </Alert>
                    )}

                    {pendenciasObra.length > 0 && (
                        <Alert severity="warning" icon={<WarningAmberIcon />}>
                            Há pendência(s) de infraestrutura identificadas na medição técnica em{" "}
                            <strong>{pendenciasObra.length} pedido(s)</strong> (ex: viga, piso ou ponto elétrico).
                            Confira os detalhes em <strong>Meus Pedidos</strong>.
                        </Alert>
                    )}

                    {/* KPIs do Cliente */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Pedidos em Andamento
                                        </Typography>
                                        <PrecisionManufacturingIcon color="primary" />
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        {pedidosAtivos.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Orçamentos Pendentes
                                        </Typography>
                                        <AssignmentIcon color={orcamentosPendentes.length > 0 ? "warning" : "action"} />
                                    </Stack>
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        color={orcamentosPendentes.length > 0 ? "warning.main" : "text.primary"}
                                        sx={{ mt: 1 }}
                                    >
                                        {orcamentosPendentes.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Portas Instaladas
                                        </Typography>
                                        <SensorDoorIcon color="success" />
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        {portasInstaladas.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card elevation={2} sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Chamados em Aberto
                                        </Typography>
                                        <BuildIcon color="warning" />
                                    </Stack>
                                    <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                                        {osAbertas.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Próximas Datas & Resumo Rápido */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={7}>
                            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Seus Pedidos Recentes
                                        </Typography>
                                        <Button size="small" onClick={() => onMudarSecao?.("cliente_pedidos")}>
                                            Ver Todos
                                        </Button>
                                    </Stack>
                                    <Divider sx={{ mb: 1.5 }} />
                                    {pedidos.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhum pedido registrado ainda para sua conta.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {pedidos.slice(0, 4).map((p) => (
                                                <Paper key={p.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            #{p.codigo_proposta || p.id} — {p.tipo_pedido}
                                                        </Typography>
                                                        <Chip size="small" color="primary" label={p.status} />
                                                    </Stack>
                                                    <Typography variant="caption" color="text.secondary" display="block">
                                                        Comercial: {p.status_aprovacao} • Total: {formatarMoedaBr(p.valor_total)} •
                                                        Previsão: {formatarDataBr(p.data_previsao_fim)}
                                                    </Typography>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                                <CardContent>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                                        <EventIcon color="primary" />
                                        <Typography variant="h6" fontWeight="bold">
                                            Próximas Datas e Visitas
                                        </Typography>
                                    </Stack>
                                    <Divider sx={{ mb: 1.5 }} />
                                    {pedidosAtivos.filter((p) => p.data_previsao_fim).length === 0 &&
                                    osAbertas.filter((os) => os.data_agendamento).length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            Nenhuma entrega ou visita técnica agendada no momento.
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.25}>
                                            {pedidosAtivos
                                                .filter((p) => p.data_previsao_fim)
                                                .map((p) => (
                                                    <Paper key={`ev-ped-${p.id}`} variant="outlined" sx={{ p: 1.25 }}>
                                                        <Typography variant="caption" color="primary.main" fontWeight="bold">
                                                            {formatarDataBr(p.data_previsao_fim)} — Previsão de Entrega
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Pedido #{p.codigo_proposta || p.id} ({p.status})
                                                        </Typography>
                                                    </Paper>
                                                ))}
                                            {osAbertas
                                                .filter((os) => os.data_agendamento)
                                                .map((os) => (
                                                    <Paper key={`ev-os-${os.id}`} variant="outlined" sx={{ p: 1.25 }}>
                                                        <Typography variant="caption" color="warning.dark" fontWeight="bold">
                                                            {formatarDataHoraBr(os.data_agendamento)} — Visita Técnica
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            OS #{os.id}: {os.tipo_servico}
                                                            {os.tecnico_responsavel?.nome_completo
                                                                ? ` • Técnico: ${os.tecnico_responsavel.nome_completo}`
                                                                : ""}
                                                        </Typography>
                                                    </Paper>
                                                ))}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Stack>
            )}

            {/* ==================== VISÃO 2: MEUS PEDIDOS E ORÇAMENTOS ==================== */}
            {secao === "cliente_pedidos" && (
                <Stack spacing={3}>
                    {pedidos.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                            <Typography variant="body1" color="text.secondary">
                                Você ainda não possui orçamentos ou pedidos registrados.
                            </Typography>
                        </Paper>
                    ) : (
                        pedidos.map((p) => {
                            const etapaIdx = Math.max(0, ETAPAS_CLIENTE.indexOf(p.status));
                            const cm = p.checklist_medicao;
                            const pendenciasLocal = [];
                            if (cm?.viga_ok === false) pendenciasLocal.push("Viga/estrutura");
                            if (cm?.piso_ok === false) pendenciasLocal.push("Nivelamento de piso");
                            if (cm?.ponto_eletrico_ok === false) pendenciasLocal.push("Ponto elétrico");

                            return (
                                <Card key={p.id} elevation={2} sx={{ borderRadius: 2 }}>
                                    <CardContent>
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            justifyContent="space-between"
                                            alignItems={{ xs: "flex-start", md: "center" }}
                                            spacing={1.5}
                                            sx={{ mb: 2 }}
                                        >
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold">
                                                    Pedido #{p.codigo_proposta || p.id} — {p.tipo_pedido}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Local: {p.endereco_instalacao || dadosCliente?.endereco || "-"} • Previsão:{" "}
                                                    {formatarDataBr(p.data_previsao_fim)}
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                                                <Chip
                                                    size="small"
                                                    color={
                                                        p.status_aprovacao === "Aprovado"
                                                            ? "success"
                                                            : p.status_aprovacao === "Reprovado"
                                                              ? "error"
                                                              : "warning"
                                                    }
                                                    label={`Orçamento: ${p.status_aprovacao}`}
                                                />
                                                <Chip size="small" color="primary" label={`Etapa: ${p.status}`} />
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={formatarMoedaBr(p.valor_total)}
                                                />
                                            </Stack>
                                        </Stack>

                                        {p.status === "Cancelado" ? (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                Este pedido foi cancelado.
                                            </Alert>
                                        ) : (
                                            <Stepper activeStep={etapaIdx} alternativeLabel sx={{ py: 1.5, mb: 2 }}>
                                                {ETAPAS_CLIENTE.map((et) => (
                                                    <Step key={et}>
                                                        <StepLabel>{et}</StepLabel>
                                                    </Step>
                                                ))}
                                            </Stepper>
                                        )}

                                        {p.status_aprovacao === "Pendente" && p.status !== "Cancelado" && (
                                            <Alert
                                                severity="info"
                                                sx={{ mb: 2 }}
                                                action={
                                                    <Stack direction="row" spacing={1}>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<ThumbUpIcon />}
                                                            onClick={() =>
                                                                setDecisaoOrcamento({ pedido: p, decisao: "Aprovado" })
                                                            }
                                                        >
                                                            Aprovar Orçamento
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<ThumbDownIcon />}
                                                            onClick={() =>
                                                                setDecisaoOrcamento({ pedido: p, decisao: "Reprovado" })
                                                            }
                                                        >
                                                            Reprovar
                                                        </Button>
                                                    </Stack>
                                                }
                                            >
                                                Proposta aguardando sua aprovação. Condições:{" "}
                                                <strong>{p.condicoes_pagamento || "A combinar"}</strong>
                                            </Alert>
                                        )}

                                        {pendenciasLocal.length > 0 && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                <strong>Pendências técnicas identificadas no local:</strong>{" "}
                                                {pendenciasLocal.join(", ")}. A fabricação inicia após a regularização.
                                            </Alert>
                                        )}

                                        {Array.isArray(p.itens) && p.itens.length > 0 && (
                                            <Table size="small">
                                                <TableHead sx={{ bgcolor: "grey.100" }}>
                                                    <TableRow>
                                                        <TableCell sx={{ fontWeight: "bold" }}>Item</TableCell>
                                                        <TableCell sx={{ fontWeight: "bold" }}>Qtd.</TableCell>
                                                        <TableCell sx={{ fontWeight: "bold" }}>Valor Unit.</TableCell>
                                                        <TableCell sx={{ fontWeight: "bold" }}>Subtotal</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {p.itens.map((it) => (
                                                        <TableRow key={it.id}>
                                                            <TableCell>
                                                                {it.item_catalogo?.descricao || `Item #${it.item_id}`}
                                                            </TableCell>
                                                            <TableCell>
                                                                {it.quantidade} {it.item_catalogo?.unidade_medida || ""}
                                                            </TableCell>
                                                            <TableCell>{formatarMoedaBr(it.valor_unitario)}</TableCell>
                                                            <TableCell sx={{ fontWeight: "bold" }}>
                                                                {formatarMoedaBr(it.valor_total)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </Stack>
            )}

            {/* ==================== VISÃO 3: MINHAS PORTAS E GARANTIAS ==================== */}
            {secao === "cliente_portas" && (
                <Grid container spacing={2}>
                    {portasInstaladas.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                                <Typography variant="body1" color="text.secondary">
                                    Você ainda não possui portas instaladas ou com número de série emitido.
                                </Typography>
                            </Paper>
                        </Grid>
                    ) : (
                        portasInstaladas.map((p) => {
                            const gar = calcularSituacaoGarantia(p.fim_garantia);
                            const cm = p.checklist_medicao;
                            return (
                                <Grid item xs={12} md={6} key={p.id}>
                                    <Card elevation={2} sx={{ borderRadius: 2, height: "100%" }}>
                                        <CardContent>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                                <Chip
                                                    icon={<QrCode2Icon />}
                                                    color="primary"
                                                    label={p.numero_serie_porta || `Pedido #${p.id}`}
                                                />
                                                <Chip
                                                    size="small"
                                                    icon={gar.vigente ? <VerifiedUserIcon /> : <WarningAmberIcon />}
                                                    color={!gar.possui ? "default" : gar.vigente ? "success" : "error"}
                                                    label={gar.label}
                                                />
                                            </Stack>

                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {cm?.modelo_automatizador || "Porta Automática APORTEC"}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                                Local: {p.endereco_instalacao || dadosCliente?.endereco || "-"} • Conclusão:{" "}
                                                {formatarDataBr(p.data_conclusao)}
                                            </Typography>

                                            {cm && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                                    <strong>Vão:</strong> {cm.medidas_vao} • <strong>Folhas:</strong>{" "}
                                                    {cm.quantidade_folhas} • <strong>Vidro:</strong> {cm.tipo_vidro || "-"}
                                                </Typography>
                                            )}

                                            {p.assinatura_cliente_instalacao && (
                                                <Box sx={{ mb: 1.5 }}>
                                                    <VisualizarAssinatura
                                                        valor={p.assinatura_cliente_instalacao}
                                                        titulo="Seu Aceite Digital da Instalação"
                                                    />
                                                </Box>
                                            )}

                                            <Button
                                                variant="outlined"
                                                color="secondary"
                                                size="small"
                                                startIcon={<BuildIcon />}
                                                onClick={() => abrirNovaSolicitacao(p)}
                                            >
                                                Solicitar Manutenção para esta Porta
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            )}

            {/* ==================== VISÃO 4: ASSISTÊNCIA / OS ==================== */}
            {secao === "cliente_os" && (
                <Stack spacing={2}>
                    {ordensServico.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                Você ainda não possui chamados de assistência técnica.
                            </Typography>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<AddIcon />}
                                onClick={() => abrirNovaSolicitacao()}
                            >
                                Abrir Primeiro Chamado
                            </Button>
                        </Paper>
                    ) : (
                        ordensServico.map((os) => (
                            <Card key={os.id} elevation={2} sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        justifyContent="space-between"
                                        alignItems={{ xs: "flex-start", sm: "center" }}
                                        spacing={1}
                                        sx={{ mb: 1 }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Chamado #{os.id} — {os.tipo_servico}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            {os.origem_cobertura && (
                                                <Chip size="small" variant="outlined" label={os.origem_cobertura} />
                                            )}
                                            <Chip
                                                size="small"
                                                color={COR_STATUS_OS[os.status_os] || "default"}
                                                label={os.status_os}
                                            />
                                        </Stack>
                                    </Stack>

                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                        {os.pedido?.numero_serie_porta
                                            ? `Porta: ${os.pedido.numero_serie_porta} • `
                                            : ""}
                                        Técnico:{" "}
                                        {os.tecnico_responsavel?.nome_completo || "Aguardando designação da equipe"} •
                                        Agendamento: {formatarDataHoraBr(os.data_agendamento)}
                                    </Typography>

                                    {os.descricao_problema && (
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Descrição:</strong> {os.descricao_problema}
                                        </Typography>
                                    )}
                                    {os.parecer_tecnico && (
                                        <Typography variant="body2" color="success.dark">
                                            <strong>Parecer Técnico:</strong> {os.parecer_tecnico}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Stack>
            )}

            {/* Modal Confirmar Aprovação / Reprovação de Orçamento (RF05) */}
            <Dialog
                open={Boolean(decisaoOrcamento)}
                onClose={() => setDecisaoOrcamento(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    {decisaoOrcamento?.decisao === "Aprovado"
                        ? "Confirmar Aprovação de Orçamento"
                        : "Confirmar Reprovação de Orçamento"}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja marcar o orçamento{" "}
                        <strong>
                            #{decisaoOrcamento?.pedido?.codigo_proposta || decisaoOrcamento?.pedido?.id}
                        </strong>{" "}
                        ({formatarMoedaBr(decisaoOrcamento?.pedido?.valor_total)}) como{" "}
                        <strong>{decisaoOrcamento?.decisao}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDecisaoOrcamento(null)} color="inherit" disabled={salvandoDecisao}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmarDecisaoOrcamento}
                        variant="contained"
                        color={decisaoOrcamento?.decisao === "Aprovado" ? "success" : "error"}
                        disabled={salvandoDecisao}
                        startIcon={<CheckCircleIcon />}
                    >
                        {salvandoDecisao ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modal Solicitar Manutenção (RF14) */}
            <Dialog open={modalOsAberto} onClose={() => setModalOsAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={enviarSolicitacaoOs}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BuildIcon color="secondary" />
                        Solicitar Atendimento / Manutenção
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 0.5 }}>
                            {erroOs && <Alert severity="error">{erroOs}</Alert>}

                            <FormControl fullWidth>
                                <InputLabel id="cli-os-porta-label">Porta / Pedido Relacionado (opcional)</InputLabel>
                                <Select
                                    labelId="cli-os-porta-label"
                                    label="Porta / Pedido Relacionado (opcional)"
                                    value={formOs.pedido_id}
                                    onChange={(e) => setFormOs({ ...formOs, pedido_id: e.target.value })}
                                >
                                    <MenuItem value="">Outro equipamento / Chamado avulso</MenuItem>
                                    {pedidos.map((p) => (
                                        <MenuItem key={p.id} value={String(p.id)}>
                                            {p.numero_serie_porta
                                                ? `Série ${p.numero_serie_porta} (Proposta #${p.codigo_proposta || p.id})`
                                                : `Pedido #${p.codigo_proposta || p.id}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel id="cli-os-tipo-label">Tipo de Solicitação</InputLabel>
                                <Select
                                    labelId="cli-os-tipo-label"
                                    label="Tipo de Solicitação"
                                    value={formOs.tipo_servico}
                                    onChange={(e) => setFormOs({ ...formOs, tipo_servico: e.target.value })}
                                >
                                    <MenuItem value="Manutencao Corretiva">Manutenção Corretiva (Problema / Defeito)</MenuItem>
                                    <MenuItem value="Manutencao Preventiva">Manutenção Preventiva (Revisão)</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                required
                                fullWidth
                                multiline
                                rows={3}
                                label="Descreva o ocorrido"
                                placeholder="Ex: A porta está abrindo devagar ou o sensor não detecta aproximação..."
                                value={formOs.descricao_problema}
                                onChange={(e) => setFormOs({ ...formOs, descricao_problema: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalOsAberto(false)} color="inherit" disabled={salvandoOs}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="secondary" disabled={salvandoOs}>
                            {salvandoOs ? <CircularProgress size={20} color="inherit" /> : "Enviar Solicitação"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
