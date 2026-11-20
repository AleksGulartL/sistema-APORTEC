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
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CabecalhoOrdenavel from "./comum/CabecalhoOrdenavel";
import PagamentoFields from "./comum/PagamentoFields";
import api from "../services/api";
import {
    calcularValorTotalPedido,
    formatarDataBr,
    formatarMoedaBr,
    obterPerfilUsuario,
    ordenarLista,
    usuarioEhAdm,
    usuarioEhFuncionario,
} from "../utils/permissoes";
import PedidoDetalhe from "./pedidos/PedidoDetalhe";

const TIPOS_PEDIDO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva"];

const FORM_INICIAL = {
    cliente_id: "",
    responsavel_producao_id: "",
    tipo_pedido: "Instalacao",
    status: "Rascunho",
    descricao_solicitacao: "",
    status_aprovacao: "Pendente",
    percentual_acrescimo: "0",
    endereco_instalacao: "",
    forma_pagamento: "",
    condicoes_pagamento: "",
    data_previsao_fim: "",
};

const EXTRATORES_PEDIDO = {
    id: (p) => Number(p.id || 0),
    cliente: (p) => p.cliente?.usuario?.nome_completo || "",
    tipo_pedido: (p) => p.tipo_pedido || "",
    status_aprovacao: (p) => p.status_aprovacao || "",
    status: (p) => p.status || "",
    valor_total: (p) => calcularValorTotalPedido(p),
    data_previsao_fim: (p) => p.data_previsao_fim || "",
};

export default function Pedidos({
    usuario,
    pedidoInicialId = null,
    onLimparContexto,
    onAbrirProntuario,
    onAbrirOs,
}) {
    const ehAdm = usuarioEhAdm(usuario);
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [pedidos, setPedidos] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [itensCatalogo, setItensCatalogo] = useState([]);
    const [usuariosSistema, setUsuariosSistema] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [somenteBloqueados, setSomenteBloqueados] = useState(false);
    const [ordenacao, setOrdenacao] = useState({ campo: "id", direcao: "asc" });

    const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(pedidoInicialId);

    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const [formNovo, setFormNovo] = useState(FORM_INICIAL);
    const [erroNovo, setErroNovo] = useState("");
    const [salvandoNovo, setSalvandoNovo] = useState(false);

    const [pedidoExcluir, setPedidoExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        if (pedidoInicialId) {
            setPedidoSelecionadoId(Number(pedidoInicialId));
        }
    }, [pedidoInicialId]);

    const carregarDados = useCallback(async () => {
        if (!ehFuncionario) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro("");
        try {
            const [resPed, resCli, resCat, resUsu] = await Promise.allSettled([
                api.get("/pedido"),
                api.get("/cliente"),
                api.get("/item_catalogo"),
                api.get("/tecnicos"),
            ]);

            if (resPed.status === "rejected") {
                setErro(resPed.reason?.response?.data?.erro || "Erro ao carregar pedidos.");
                return;
            }

            setPedidos(Array.isArray(resPed.value.data) ? resPed.value.data : []);
            setClientes(resCli.status === "fulfilled" && Array.isArray(resCli.value.data) ? resCli.value.data : []);
            setItensCatalogo(
                resCat.status === "fulfilled" && Array.isArray(resCat.value.data) ? resCat.value.data : []
            );
            setUsuariosSistema(
                resUsu.status === "fulfilled" && Array.isArray(resUsu.value.data) ? resUsu.value.data : []
            );
        } catch (err) {
            console.error("Erro ao carregar módulo de pedidos:", err);
            setErro("Erro inesperado ao carregar pedidos.");
        } finally {
            setCarregando(false);
        }
    }, [ehAdm, ehFuncionario]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const tecnicosDisponiveis = useMemo(
        () => usuariosSistema.filter((u) => u.perfil === "TECNICO" && u.ativo === true),
        [usuariosSistema]
    );

    const pedidoSelecionado = useMemo(
        () => pedidos.find((p) => Number(p.id) === Number(pedidoSelecionadoId)) || null,
        [pedidos, pedidoSelecionadoId]
    );

    const pedidosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const filtrados = pedidos.filter((p) => {
            if (somenteBloqueados && !p.bloqueio_fabricacao) return false;
            if (filtroTipo !== "TODOS" && p.tipo_pedido !== filtroTipo) return false;
            if (!termo) return true;
            const nomeCliente = String(p.cliente?.usuario?.nome_completo || "").toLowerCase();
            return (
                String(p.id).includes(termo) ||
                String(p.numero_serie || "").toLowerCase().includes(termo) ||
                nomeCliente.includes(termo)
            );
        });
        return ordenarLista(filtrados, ordenacao.campo, ordenacao.direcao, EXTRATORES_PEDIDO);
    }, [pedidos, busca, filtroTipo, somenteBloqueados, ordenacao]);

    async function atualizarPedidoIndividual(id) {
        try {
            const res = await api.get(`/pedido/${id}`);
            const atualizado = res.data;
            setPedidos((prev) => {
                const existe = prev.some((p) => Number(p.id) === Number(id));
                if (!existe) return [...prev, atualizado];
                return prev.map((p) => (Number(p.id) === Number(id) ? atualizado : p));
            });
        } catch (err) {
            console.error("Erro ao recarregar pedido:", err);
            await carregarDados();
        }
    }

    async function criarNovoPedido(event) {
        event.preventDefault();
        setErroNovo("");

        if (!formNovo.cliente_id) {
            setErroNovo("Selecione o cliente do pedido.");
            return;
        }

        const percNum = Number(formNovo.percentual_acrescimo || 0);
        if (isNaN(percNum) || percNum < 0) {
            setErroNovo("O percentual de acréscimo deve ser maior ou igual a zero.");
            return;
        }

        const payload = {
            cliente_id: Number(formNovo.cliente_id),
            usuario_criador_id: Number(usuario?.id),
            responsavel_producao_id: formNovo.responsavel_producao_id
                ? Number(formNovo.responsavel_producao_id)
                : null,
            tipo_pedido: formNovo.tipo_pedido,
            descricao_solicitacao: formNovo.descricao_solicitacao.trim() || null,
            status: formNovo.status,
            status_aprovacao: formNovo.status_aprovacao,
            percentual_acrescimo: percNum,
            endereco_instalacao: formNovo.endereco_instalacao.trim() || null,
            forma_pagamento: formNovo.forma_pagamento.trim() || null,
            condicoes_pagamento: formNovo.condicoes_pagamento.trim() || null,
            data_previsao_fim: formNovo.data_previsao_fim || null,
            bloqueio_fabricacao: true,
            motivo_bloqueio: "Aguardando aprovação comercial e checklist técnico de medição.",
        };

        setSalvandoNovo(true);
        try {
            const res = await api.post("/pedido", payload);
            const criado = res.data;
            setModalNovoAberto(false);
            setFormNovo(FORM_INICIAL);
            setSucessoMsg(`Pedido #${criado.id} criado! Adicione os itens e realize a medição.`);
            await carregarDados();
            setPedidoSelecionadoId(criado.id);
        } catch (err) {
            console.error("Erro ao criar pedido:", err);
            setErroNovo(err.response?.data?.erro || "Erro ao criar pedido.");
        } finally {
            setSalvandoNovo(false);
        }
    }

    async function confirmarExclusao() {
        if (!pedidoExcluir) return;
        setExcluindo(true);
        try {
            await api.delete(`/pedido/${pedidoExcluir.id}`);
            setSucessoMsg(`Pedido #${pedidoExcluir.id} removido.`);
            setPedidoExcluir(null);
            carregarDados();
        } catch (err) {
            console.error("Erro ao excluir pedido:", err);
            setErro(err.response?.data?.erro || "Erro ao excluir pedido.");
            setPedidoExcluir(null);
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

    if (pedidoSelecionado) {
        return (
            <Box sx={{ py: 3 }}>
                <PedidoDetalhe
                    pedido={pedidoSelecionado}
                    clientes={clientes}
                    itensCatalogo={itensCatalogo}
                    tecnicos={tecnicosDisponiveis}
                    usuario={usuario}
                    ehAdm={ehAdm}
                    onVoltar={() => {
                        setPedidoSelecionadoId(null);
                        onLimparContexto?.();
                    }}
                    onPedidoAtualizado={atualizarPedidoIndividual}
                    onAbrirProntuario={onAbrirProntuario}
                    onAbrirOs={onAbrirOs}
                />
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
                        Pedidos, Orçamentos e Produção
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gestão unificada da proposta comercial, itens, checklist de medição e produção (RF03–RF09, RF12, RF13)
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={carregarDados}
                        disabled={carregando}
                    >
                        Atualizar
                    </Button>
                    {ehAdm && <Button variant="outlined" startIcon={<AddIcon />} onClick={() => {
                        setFormNovo({ ...FORM_INICIAL, status: "Recebida" }); setErroNovo(""); setModalNovoAberto(true);
                    }}>Nova solicitação</Button>}
                    {ehAdm && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setFormNovo(FORM_INICIAL);
                                setErroNovo("");
                                setModalNovoAberto(true);
                            }}
                        >
                            Novo orçamento
                        </Button>
                    )}
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
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <TextField
                        size="small"
                        placeholder="Buscar por #pedido, cliente ou nº de série..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        sx={{ minWidth: { xs: "100%", md: 300 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                        <Chip
                            size="small"
                            label={`Todos (${pedidos.length})`}
                            color={filtroTipo === "TODOS" && !somenteBloqueados ? "primary" : "default"}
                            variant={filtroTipo === "TODOS" && !somenteBloqueados ? "filled" : "outlined"}
                            onClick={() => {
                                setFiltroTipo("TODOS");
                                setSomenteBloqueados(false);
                            }}
                        />
                        {TIPOS_PEDIDO.map((tp) => (
                            <Chip
                                key={tp}
                                size="small"
                                label={tp}
                                color={filtroTipo === tp ? "primary" : "default"}
                                variant={filtroTipo === tp ? "filled" : "outlined"}
                                onClick={() => setFiltroTipo(filtroTipo === tp ? "TODOS" : tp)}
                            />
                        ))}
                        <Chip
                            size="small"
                            icon={<LockIcon />}
                            label={`Bloqueados (${pedidos.filter((p) => p.bloqueio_fabricacao).length})`}
                            color={somenteBloqueados ? "error" : "default"}
                            variant={somenteBloqueados ? "filled" : "outlined"}
                            onClick={() => setSomenteBloqueados((prev) => !prev)}
                        />
                    </Stack>
                </Stack>
            </Card>

            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : pedidosFiltrados.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Nenhum pedido encontrado para os filtros informados.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table sx={{ minWidth: 820 }}>
                        <TableHead sx={{ bgcolor: "primary.main" }}>
                            <TableRow>
                                <CabecalhoOrdenavel
                                    campo="id"
                                    rotulo="Pedido"
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
                                    campo="tipo_pedido"
                                    rotulo="Tipo"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="status_aprovacao"
                                    rotulo="Comercial"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Avaliação técnica</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Trava (RF08)</TableCell>
                                <CabecalhoOrdenavel
                                    campo="status"
                                    rotulo="Etapa"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="valor_total"
                                    rotulo="Total"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <CabecalhoOrdenavel
                                    campo="data_previsao_fim"
                                    rotulo="Previsão"
                                    ordenacao={ordenacao}
                                    onOrdenar={setOrdenacao}
                                />
                                <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedidosFiltrados.map((p) => {
                                const nomeCli = p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
                                const medStatus = p.tipo_pedido === "Instalacao" ? p.checklist_medicao?.status_aprovacao || "Não feita" : p.diagnostico_tecnico ? "Registrada" : "Pendente";

                                return (
                                    <TableRow
                                        key={p.id}
                                        hover
                                        sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}
                                    >
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            #{p.id}
                                            {p.numero_serie && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Série: {p.numero_serie}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{nomeCli}</TableCell>
                                        <TableCell>{p.tipo_pedido}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={
                                                    p.status_aprovacao === "Aprovado"
                                                        ? "success"
                                                        : p.status_aprovacao === "Reprovado"
                                                          ? "error"
                                                          : "warning"
                                                }
                                                variant="outlined"
                                                label={p.status_aprovacao}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={
                                                    medStatus === "Aprovado"
                                                        ? "success"
                                                        : medStatus === "Reprovado"
                                                          ? "error"
                                                          : "default"
                                                }
                                                variant="outlined"
                                                label={medStatus}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip title={p.motivo_bloqueio || "Liberado"}>
                                                <Chip
                                                    size="small"
                                                    icon={p.bloqueio_fabricacao ? <LockIcon /> : <LockOpenIcon />}
                                                    color={p.bloqueio_fabricacao ? "error" : "success"}
                                                    label={p.bloqueio_fabricacao ? "Travado" : "Liberado"}
                                                />
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip size="small" color="primary" label={p.status} />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "medium" }}>
                                            {formatarMoedaBr(calcularValorTotalPedido(p))}
                                        </TableCell>
                                        <TableCell>{formatarDataBr(p.data_previsao_fim)}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Abrir Detalhes do Pedido">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => setPedidoSelecionadoId(p.id)}
                                                >
                                                    <VisibilityIcon />
                                                </IconButton>
                                            </Tooltip>
                                            {ehAdm && (
                                                <Tooltip title="Excluir Pedido">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => setPedidoExcluir(p)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={modalNovoAberto} onClose={() => setModalNovoAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={criarNovoPedido}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PrecisionManufacturingIcon color="primary" />
                        {formNovo.status === "Recebida" ? "Nova solicitação de serviço" : "Novo orçamento"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroNovo && <Alert severity="error">{erroNovo}</Alert>}

                            <FormControl fullWidth required>
                                <InputLabel id="novo-ped-cliente-label">Cliente</InputLabel>
                                <Select
                                    labelId="novo-ped-cliente-label"
                                    label="Cliente"
                                    value={formNovo.cliente_id}
                                    onChange={(e) => {
                                        const cliId = e.target.value;
                                        const cli = clientes.find((c) => Number(c.usuario_id) === Number(cliId));
                                        setFormNovo({
                                            ...formNovo,
                                            cliente_id: cliId,
                                            endereco_instalacao: cli?.endereco || formNovo.endereco_instalacao,
                                        });
                                    }}
                                >
                                    {clientes.map((c) => (
                                        <MenuItem key={c.usuario_id} value={String(c.usuario_id)}>
                                            {c.usuario?.nome_completo || `Cliente #${c.usuario_id}`} ({c.cnpj_cpf})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="novo-ped-tipo-label">Tipo do Pedido</InputLabel>
                                        <Select
                                            labelId="novo-ped-tipo-label"
                                            label="Tipo do Pedido"
                                            value={formNovo.tipo_pedido}
                                            onChange={(e) =>
                                                setFormNovo({ ...formNovo, tipo_pedido: e.target.value })
                                            }
                                        >
                                            {TIPOS_PEDIDO.map((tp) => (
                                                <MenuItem key={tp} value={tp}>
                                                    {tp}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        inputProps={{ min: 0, step: "0.01" }}
                                        label="Acréscimo / Margem (%)"
                                        value={formNovo.percentual_acrescimo}
                                        onChange={(e) =>
                                            setFormNovo({ ...formNovo, percentual_acrescimo: e.target.value })
                                        }
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Estado inicial" value={formNovo.status} disabled
                                        helperText="Definido automaticamente pelo tipo de cadastro." />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Previsão de Entrega"
                                        InputLabelProps={{ shrink: true }}
                                        value={formNovo.data_previsao_fim}
                                        onChange={(e) =>
                                            setFormNovo({ ...formNovo, data_previsao_fim: e.target.value })
                                        }
                                    />
                                </Grid>
                            </Grid>

                            <TextField fullWidth multiline label="Descrição da solicitação" required={formNovo.status === "Recebida"}
                                value={formNovo.descricao_solicitacao} onChange={(e) => setFormNovo({ ...formNovo, descricao_solicitacao: e.target.value })} />
                            <FormControl fullWidth>
                                <InputLabel id="novo-ped-resp-label">Técnico responsável (opcional)</InputLabel>
                                <Select
                                    labelId="novo-ped-resp-label"
                                    label="Técnico responsável (opcional)"
                                    value={formNovo.responsavel_producao_id}
                                    onChange={(e) =>
                                        setFormNovo({ ...formNovo, responsavel_producao_id: e.target.value })
                                    }
                                >
                                    <MenuItem value="">Não definido</MenuItem>
                                    {tecnicosDisponiveis.map((t) => (
                                        <MenuItem key={t.id} value={String(t.id)}>
                                            {t.nome_completo} ({t.perfil})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Endereço de Instalação"
                                value={formNovo.endereco_instalacao}
                                onChange={(e) =>
                                    setFormNovo({ ...formNovo, endereco_instalacao: e.target.value })
                                }
                            />

                            <PagamentoFields forma={formNovo.forma_pagamento || ""} condicoes={formNovo.condicoes_pagamento || ""}
                                
                                onForma={(value) => setFormNovo((form) => ({ ...form, forma_pagamento: value }))}
                                onCondicoes={(value) => setFormNovo((form) => ({ ...form, condicoes_pagamento: value }))} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalNovoAberto(false)} color="inherit" disabled={salvandoNovo}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={salvandoNovo}>
                            {salvandoNovo ? <CircularProgress size={22} color="inherit" /> : formNovo.status === "Recebida" ? "Registrar solicitação" : "Criar orçamento"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={Boolean(pedidoExcluir)} onClose={() => setPedidoExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente remover o pedido <strong>#{pedidoExcluir?.id}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPedidoExcluir(null)} color="inherit" disabled={excluindo}>
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
