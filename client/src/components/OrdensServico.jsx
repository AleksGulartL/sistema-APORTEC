import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BuildIcon from "@mui/icons-material/Build";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CabecalhoOrdenavel from "./comum/CabecalhoOrdenavel";
import api from "../services/api";
import {
    calcularSituacaoGarantia,
    formatarDataHoraBr,
    formatarParaInputDateTimeLocal,
    obterPerfilUsuario,
    ordenarLista,
    usuarioEhAdm,
    usuarioEhFuncionario,
} from "../utils/permissoes";
import AssinaturaDigital from "./comum/AssinaturaDigital";

const TIPOS_SERVICO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];
const COBERTURAS = ["Garantia", "Contrato", "Avulso"];
const STATUS_OS = ["Aberta", "Em Andamento", "Finalizada", "Cancelada"];

const COR_STATUS_OS = {
    Aberta: "info",
    "Em Andamento": "warning",
    Finalizada: "success",
    Cancelada: "error",
};

const FORM_INICIAL = {
    id: null,
    cliente_id_filtro: "",
    pedido_id: "",
    tecnico_responsavel_id: "",
    tipo_servico: "Manutencao Corretiva",
    origem_cobertura: "Avulso",
    status_os: "Aberta",
    data_agendamento: "",
    descricao_problema: "",
};

const EXTRATORES_OS = {
    id: (os) => Number(os.id || 0),
    cliente: (os) => os.pedido?.cliente?.usuario?.nome_completo || "",
    pedido_id: (os) => Number(os.pedido_id || 0),
    tipo_servico: (os) => os.tipo_servico || "",
    tecnico: (os) => os.tecnico_responsavel?.nome_completo || "",
    data_agendamento: (os) => os.data_agendamento || "",
    status_os: (os) => os.status_os || "",
};

export default function OrdensServico({ usuario, pedidoParaNovaOs = null, onLimparContexto }) {
    const ehAdm = usuarioEhAdm(usuario);
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [ordens, setOrdens] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [usuariosSistema, setUsuariosSistema] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("TODAS");
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [ordenacao, setOrdenacao] = useState({ campo: "id", direcao: "asc" });

    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [erroModal, setErroModal] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [osAtender, setOsAtender] = useState(null);
    const [statusAtender, setStatusAtender] = useState("Finalizada");
    const [parecerAtender, setParecerAtender] = useState("");
    const [assinaturaAtender, setAssinaturaAtender] = useState("");
    const [erroAtender, setErroAtender] = useState("");
    const [salvandoAtender, setSalvandoAtender] = useState(false);

    const [osExcluir, setOsExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregarDados = useCallback(async () => {
        if (!ehFuncionario) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro("");
        try {
            const [resOs, resCli, resPed, resUsu] = await Promise.allSettled([
                api.get("/ordem_servico"),
                api.get("/cliente"),
                api.get("/pedido"),
                ehAdm ? api.get("/usuarios") : Promise.resolve({ data: [] }),
            ]);

            if (resOs.status === "rejected") {
                setErro(resOs.reason?.response?.data?.erro || "Erro ao carregar ordens de serviço.");
                return;
            }

            setOrdens(Array.isArray(resOs.value.data) ? resOs.value.data : []);
            setClientes(resCli.status === "fulfilled" && Array.isArray(resCli.value.data) ? resCli.value.data : []);
            setPedidos(resPed.status === "fulfilled" && Array.isArray(resPed.value.data) ? resPed.value.data : []);
            setUsuariosSistema(
                resUsu.status === "fulfilled" && Array.isArray(resUsu.value.data) ? resUsu.value.data : []
            );
        } catch (err) {
            console.error("Erro ao carregar OS:", err);
            setErro("Erro inesperado ao carregar ordens de serviço.");
        } finally {
            setCarregando(false);
        }
    }, [ehAdm, ehFuncionario]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const tecnicosDisponiveis = useMemo(() => {
        const mapa = new Map();
        const add = (u) => {
            if (!u || !u.id) return;
            if (u.perfil === "CLIENTE") return;
            mapa.set(Number(u.id), {
                id: Number(u.id),
                nome_completo: u.nome_completo || `Usuário #${u.id}`,
                perfil: u.perfil || "TECNICO",
            });
        };

        if (usuario) {
            add({
                id: usuario.id,
                nome_completo: usuario.nome_completo,
                perfil: obterPerfilUsuario(usuario),
            });
        }
        for (const u of usuariosSistema) add(u);
        for (const os of ordens) {
            if (os.tecnico_responsavel) add(os.tecnico_responsavel);
        }
        for (const p of pedidos) {
            if (p.responsavel_producao) add(p.responsavel_producao);
        }
        return Array.from(mapa.values());
    }, [usuario, usuariosSistema, ordens, pedidos]);

    useEffect(() => {
        if (!pedidoParaNovaOs) return;
        const gar = calcularSituacaoGarantia(pedidoParaNovaOs.fim_garantia);
        setModoEdicao(false);
        setForm({
            ...FORM_INICIAL,
            cliente_id_filtro: pedidoParaNovaOs.cliente_id ? String(pedidoParaNovaOs.cliente_id) : "",
            pedido_id: pedidoParaNovaOs.id ? String(pedidoParaNovaOs.id) : "",
            tecnico_responsavel_id: String(usuario?.id ?? ""),
            tipo_servico: pedidoParaNovaOs.status === "Pronto para Instalacao" ? "Instalacao" : "Manutencao Corretiva",
            origem_cobertura: gar.vigente ? "Garantia" : "Avulso",
        });
        setErroModal("");
        setModalAberto(true);
        onLimparContexto?.();
    }, [pedidoParaNovaOs, usuario, onLimparContexto]);

    const pedidosDisponiveisForm = useMemo(() => {
        if (!form.cliente_id_filtro) return pedidos;
        return pedidos.filter((p) => Number(p.cliente_id) === Number(form.cliente_id_filtro));
    }, [pedidos, form.cliente_id_filtro]);

    const pedidoVinculadoForm = useMemo(
        () => pedidos.find((p) => Number(p.id) === Number(form.pedido_id)) || null,
        [pedidos, form.pedido_id]
    );

    const ordensFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const filtradas = ordens.filter((os) => {
            if (filtroStatus !== "TODAS" && os.status_os !== filtroStatus) return false;
            if (filtroTipo !== "TODOS" && os.tipo_servico !== filtroTipo) return false;
            if (!termo) return true;
            const nomeCli = String(os.pedido?.cliente?.usuario?.nome_completo || "").toLowerCase();
            const nomeTec = String(os.tecnico_responsavel?.nome_completo || "").toLowerCase();
            const serie = String(os.pedido?.numero_serie || "").toLowerCase();
            return (
                String(os.id).includes(termo) ||
                String(os.pedido_id || "").includes(termo) ||
                nomeCli.includes(termo) ||
                nomeTec.includes(termo) ||
                serie.includes(termo) ||
                String(os.descricao_problema || "").toLowerCase().includes(termo)
            );
        });
        return ordenarLista(filtradas, ordenacao.campo, ordenacao.direcao, EXTRATORES_OS);
    }, [ordens, busca, filtroStatus, filtroTipo, ordenacao]);

    function abrirNovaOs() {
        setModoEdicao(false);
        setForm({
            ...FORM_INICIAL,
            pedido_id: pedidos[0]?.id ? String(pedidos[0].id) : "",
            tecnico_responsavel_id: String(usuario?.id ?? ""),
        });
        setErroModal("");
        setModalAberto(true);
    }

    function abrirEdicao(os) {
        setModoEdicao(true);
        setForm({
            id: os.id,
            cliente_id_filtro: os.pedido?.cliente_id ? String(os.pedido.cliente_id) : "",
            pedido_id: os.pedido_id ? String(os.pedido_id) : "",
            tecnico_responsavel_id: os.tecnico_responsavel_id ? String(os.tecnico_responsavel_id) : "",
            tipo_servico: os.tipo_servico || "Manutencao Corretiva",
            origem_cobertura: os.origem_cobertura || "Avulso",
            status_os: os.status_os || "Aberta",
            data_agendamento: formatarParaInputDateTimeLocal(os.data_agendamento),
            descricao_problema: os.descricao_problema || "",
        });
        setErroModal("");
        setModalAberto(true);
    }

    async function salvarOs(event) {
        event.preventDefault();
        setErroModal("");

        if (!form.pedido_id) {
            setErroModal("Selecione o pedido / porta vinculada à Ordem de Serviço.");
            return;
        }

        const payload = {
            pedido_id: Number(form.pedido_id),
            tecnico_responsavel_id: form.tecnico_responsavel_id ? Number(form.tecnico_responsavel_id) : null,
            tipo_servico: form.tipo_servico,
            origem_cobertura: form.origem_cobertura || null,
            status_os: form.status_os,
            descricao_problema: form.descricao_problema.trim() || null,
            data_agendamento: form.data_agendamento ? new Date(form.data_agendamento).toISOString() : null,
        };

        if (form.status_os === "Finalizada") {
            payload.data_conclusao = new Date().toISOString();
        }

        setSalvando(true);
        try {
            if (modoEdicao) {
                await api.put(`/ordem_servico/${form.id}`, payload);
                setSucessoMsg(`Ordem de Serviço #${form.id} atualizada com sucesso!`);
            } else {
                const res = await api.post("/ordem_servico", payload);
                setSucessoMsg(`Ordem de Serviço #${res.data?.id || ""} aberta com sucesso!`);
            }
            setModalAberto(false);
            carregarDados();
        } catch (err) {
            console.error("Erro ao salvar OS:", err);
            setErroModal(err.response?.data?.erro || "Erro ao salvar Ordem de Serviço.");
        } finally {
            setSalvando(false);
        }
    }

    function abrirAtendimento(os) {
        setOsAtender(os);
        setStatusAtender(os.status_os === "Aberta" ? "Finalizada" : os.status_os || "Finalizada");
        setParecerAtender(os.parecer_tecnico || "");
        setAssinaturaAtender(os.assinatura_cliente_digital || "");
        setErroAtender("");
    }

    async function salvarAtendimento(event) {
        event.preventDefault();
        if (!osAtender) return;
        setErroAtender("");

        if (statusAtender === "Finalizada" && !parecerAtender.trim()) {
            setErroAtender("Informe o parecer técnico para finalizar a Ordem de Serviço.");
            return;
        }

        if (statusAtender === "Finalizada" && (!assinaturaAtender || !assinaturaAtender.trim())) {
            setErroAtender("Colete a assinatura digital do cliente para finalizar a Ordem de Serviço.");
            return;
        }

        const payload = {
            status_os: statusAtender,
            parecer_tecnico: parecerAtender.trim() || null,
            assinatura_cliente_digital: assinaturaAtender?.trim() || null,
        };

        if (statusAtender === "Finalizada") {
            payload.data_conclusao = osAtender.data_conclusao || new Date().toISOString();
        }

        setSalvandoAtender(true);
        try {
            await api.put(`/ordem_servico/${osAtender.id}`, payload);
            setSucessoMsg(`Ordem de Serviço #${osAtender.id} atualizada (${statusAtender})!`);
            setOsAtender(null);
            carregarDados();
        } catch (err) {
            console.error("Erro ao finalizar OS:", err);
            setErroAtender(err.response?.data?.erro || "Erro ao atualizar atendimento da OS.");
        } finally {
            setSalvandoAtender(false);
        }
    }

    async function confirmarExclusao() {
        if (!osExcluir) return;
        setExcluindo(true);
        try {
            await api.delete(`/ordem_servico/${osExcluir.id}`);
            setSucessoMsg(`Ordem de Serviço #${osExcluir.id} removida.`);
            setOsExcluir(null);
            carregarDados();
        } catch (err) {
            console.error("Erro ao excluir OS:", err);
            setErro(err.response?.data?.erro || "Erro ao excluir Ordem de Serviço.");
            setOsExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    if (!ehFuncionario) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="info">
                    Acesso restrito a colaboradores (ADM ou TECNICO). Perfil atual:{" "}
                    <strong>{obterPerfilUsuario(usuario) || "CLIENTE"}</strong>.
                </Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 3 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={2}
                sx={{ mb: 3 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="text.primary">
                        Ordens de Serviço (Assistência)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Abertura de chamados, cobertura, agendamento técnico, parecer e assinatura digital (RF14)
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={carregarDados}
                        disabled={carregando}
                    >
                        Atualizar
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovaOs}>
                        Nova OS
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

            <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", md: "center" }}
                    >
                        <TextField
                            size="small"
                            placeholder="Buscar por #OS, cliente, nº de série, técnico ou problema..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            sx={{ minWidth: { xs: "100%", md: 340 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel id="filtro-tipo-os-label">Tipo de Serviço</InputLabel>
                            <Select
                                labelId="filtro-tipo-os-label"
                                label="Tipo de Serviço"
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                            >
                                <MenuItem value="TODOS">Todos os Tipos</MenuItem>
                                {TIPOS_SERVICO.map((t) => (
                                    <MenuItem key={t} value={t}>
                                        {t}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                            size="small"
                            label={`Todas (${ordens.length})`}
                            color={filtroStatus === "TODAS" ? "primary" : "default"}
                            variant={filtroStatus === "TODAS" ? "filled" : "outlined"}
                            onClick={() => setFiltroStatus("TODAS")}
                        />
                        {STATUS_OS.map((st) => {
                            const qtd = ordens.filter((o) => o.status_os === st).length;
                            return (
                                <Chip
                                    key={st}
                                    size="small"
                                    label={`${st} (${qtd})`}
                                    color={filtroStatus === st ? COR_STATUS_OS[st] || "primary" : "default"}
                                    variant={filtroStatus === st ? "filled" : "outlined"}
                                    onClick={() => setFiltroStatus(filtroStatus === st ? "TODAS" : st)}
                                />
                            );
                        })}
                    </Stack>
                </Stack>
            </Card>

            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : ordensFiltradas.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Nenhuma Ordem de Serviço encontrada.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table sx={{ minWidth: 820 }}>
                        <TableHead sx={{ bgcolor: "primary.main" }}>
                            <TableRow>
                                <CabecalhoOrdenavel
                                    campo="id"
                                    rotulo="OS"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="cliente"
                                    rotulo="Cliente"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="pedido_id"
                                    rotulo="Pedido / Porta"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="tipo_servico"
                                    rotulo="Serviço / Cobertura"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="tecnico"
                                    rotulo="Técnico"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="data_agendamento"
                                    rotulo="Agendamento"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="status_os"
                                    rotulo="Status"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ordensFiltradas.map((os) => {
                                const nomeCli =
                                    os.pedido?.cliente?.usuario?.nome_completo ||
                                    (os.pedido?.cliente_id ? `Cliente #${os.pedido.cliente_id}` : "-");
                                const nomeTec =
                                    os.tecnico_responsavel?.nome_completo ||
                                    (os.tecnico_responsavel_id
                                        ? `Técnico #${os.tecnico_responsavel_id}`
                                        : "Aguardando atribuição");
                                return (
                                    <TableRow
                                        key={os.id}
                                        hover
                                        sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}
                                    >
                                        <TableCell sx={{ fontWeight: "bold" }}>#{os.id}</TableCell>
                                        <TableCell>{nomeCli}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                Pedido #{os.pedido_id}
                                            </Typography>
                                            {os.pedido?.numero_serie && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Série: {os.pedido.numero_serie}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {os.tipo_servico}
                                            </Typography>
                                            {os.origem_cobertura && (
                                                <Chip
                                                    size="small"
                                                    variant="outlined"
                                                    label={os.origem_cobertura}
                                                    sx={{ mt: 0.25, height: 20, fontSize: "0.7rem" }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {os.tecnico_responsavel_id ? (
                                                nomeTec
                                            ) : (
                                                <Chip size="small" variant="outlined" color="warning" label={nomeTec} />
                                            )}
                                        </TableCell>
                                        <TableCell>{formatarDataHoraBr(os.data_agendamento)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={COR_STATUS_OS[os.status_os] || "default"}
                                                label={os.status_os}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="Atender / Finalizar com Parecer e Assinatura">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                        onClick={() => abrirAtendimento(os)}
                                                    >
                                                        <AssignmentTurnedInIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Editar Ordem de Serviço">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => abrirEdicao(os)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {ehAdm && (
                                                    <Tooltip title="Excluir OS">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => setOsExcluir(os)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarOs}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BuildIcon color="primary" />
                        {modoEdicao ? `Editar Ordem de Serviço #${form.id}` : "Abrir Nova Ordem de Serviço"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroModal && <Alert severity="error">{erroModal}</Alert>}

                            <FormControl fullWidth>
                                <InputLabel id="os-cliente-label">Filtrar por Cliente (opcional)</InputLabel>
                                <Select
                                    labelId="os-cliente-label"
                                    label="Filtrar por Cliente (opcional)"
                                    value={form.cliente_id_filtro}
                                    onChange={(e) =>
                                        setForm({ ...form, cliente_id_filtro: e.target.value, pedido_id: "" })
                                    }
                                >
                                    <MenuItem value="">Todos os Clientes</MenuItem>
                                    {clientes.map((c) => (
                                        <MenuItem key={c.usuario_id} value={String(c.usuario_id)}>
                                            {c.usuario?.nome_completo || `Cliente #${c.usuario_id}`} ({c.cnpj_cpf})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth required>
                                <InputLabel id="os-pedido-label">Pedido / Porta Vinculada</InputLabel>
                                <Select
                                    labelId="os-pedido-label"
                                    label="Pedido / Porta Vinculada"
                                    value={form.pedido_id}
                                    onChange={(e) => {
                                        const pedId = e.target.value;
                                        const ped = pedidos.find((p) => Number(p.id) === Number(pedId));
                                        const gar = ped ? calcularSituacaoGarantia(ped.fim_garantia) : null;
                                        setForm({
                                            ...form,
                                            pedido_id: pedId,
                                            origem_cobertura: gar?.vigente ? "Garantia" : form.origem_cobertura,
                                        });
                                    }}
                                >
                                    {pedidosDisponiveisForm.map((p) => (
                                        <MenuItem key={p.id} value={String(p.id)}>
                                            Pedido #{p.id} —{" "}
                                            {p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`}
                                            {p.numero_serie ? ` • Série: ${p.numero_serie}` : ""} ({p.status})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {pedidoVinculadoForm?.fim_garantia && (
                                <Alert
                                    severity={
                                        calcularSituacaoGarantia(pedidoVinculadoForm.fim_garantia).vigente
                                            ? "info"
                                            : "warning"
                                    }
                                >
                                    Garantia do pedido:{" "}
                                    <strong>{calcularSituacaoGarantia(pedidoVinculadoForm.fim_garantia).label}</strong>
                                </Alert>
                            )}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="os-tipo-label">Tipo de Serviço</InputLabel>
                                        <Select
                                            labelId="os-tipo-label"
                                            label="Tipo de Serviço"
                                            value={form.tipo_servico}
                                            onChange={(e) => setForm({ ...form, tipo_servico: e.target.value })}
                                        >
                                            {TIPOS_SERVICO.map((t) => (
                                                <MenuItem key={t} value={t}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="os-cobertura-label">Origem / Cobertura</InputLabel>
                                        <Select
                                            labelId="os-cobertura-label"
                                            label="Origem / Cobertura"
                                            value={form.origem_cobertura}
                                            onChange={(e) => setForm({ ...form, origem_cobertura: e.target.value })}
                                        >
                                            {COBERTURAS.map((c) => (
                                                <MenuItem key={c} value={c}>
                                                    {c}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="os-tecnico-label">Técnico Responsável</InputLabel>
                                        <Select
                                            labelId="os-tecnico-label"
                                            label="Técnico Responsável"
                                            value={form.tecnico_responsavel_id}
                                            onChange={(e) =>
                                                setForm({ ...form, tecnico_responsavel_id: e.target.value })
                                            }
                                        >
                                            <MenuItem value="">Aguardando atribuição</MenuItem>
                                            {tecnicosDisponiveis.map((t) => (
                                                <MenuItem key={t.id} value={String(t.id)}>
                                                    {t.nome_completo} ({t.perfil})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="os-status-label">Status</InputLabel>
                                        <Select
                                            labelId="os-status-label"
                                            label="Status"
                                            value={form.status_os}
                                            onChange={(e) => setForm({ ...form, status_os: e.target.value })}
                                        >
                                            {STATUS_OS.map((s) => (
                                                <MenuItem key={s} value={s}>
                                                    {s}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="Data e Hora do Agendamento"
                                InputLabelProps={{ shrink: true }}
                                value={form.data_agendamento}
                                onChange={(e) => setForm({ ...form, data_agendamento: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Descrição do Problema / Escopo do Serviço"
                                placeholder="Descreva o defeito relatado ou o serviço a executar..."
                                value={form.descricao_problema}
                                onChange={(e) => setForm({ ...form, descricao_problema: e.target.value })}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalAberto(false)} color="inherit" disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={salvando}>
                            {salvando ? <CircularProgress size={22} color="inherit" /> : "Salvar OS"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={Boolean(osAtender)} onClose={() => setOsAtender(null)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarAtendimento}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <AssignmentTurnedInIcon color="success" />
                        Atendimento e Encerramento da OS #{osAtender?.id}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroAtender && <Alert severity="error">{erroAtender}</Alert>}

                            <FormControl fullWidth>
                                <InputLabel id="atender-status-label">Novo Status da OS</InputLabel>
                                <Select
                                    labelId="atender-status-label"
                                    label="Novo Status da OS"
                                    value={statusAtender}
                                    onChange={(e) => setStatusAtender(e.target.value)}
                                >
                                    {STATUS_OS.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                required={statusAtender === "Finalizada"}
                                fullWidth
                                multiline
                                rows={3}
                                label="Parecer Técnico do Atendimento"
                                placeholder="Descreva a causa diagnosticada, peças substituídas e ajustes realizados..."
                                value={parecerAtender}
                                onChange={(e) => setParecerAtender(e.target.value)}
                            />

                            <AssinaturaDigital
                                valor={assinaturaAtender}
                                onChange={setAssinaturaAtender}
                                label="Assinatura Digital do Cliente (Comprovante de Atendimento)"
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOsAtender(null)} color="inherit" disabled={salvandoAtender}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="success" disabled={salvandoAtender}>
                            {salvandoAtender ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                "Registrar Parecer e Salvar"
                            )}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={Boolean(osExcluir)} onClose={() => setOsExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente remover a Ordem de Serviço <strong>#{osExcluir?.id}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOsExcluir(null)} color="inherit" disabled={excluindo}>
                        Cancelar
                    </Button>
                    <Button onClick={confirmarExclusao} color="error" variant="contained" disabled={excluindo}>
                        {excluindo ? <CircularProgress size={20} color="inherit" /> : "Excluir"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
