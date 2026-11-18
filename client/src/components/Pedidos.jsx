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
import api from "../services/api";
import {
    formatarDataBr,
    formatarMoedaBr,
    obterPerfilUsuario,
    usuarioEhAdm,
    usuarioEhFuncionario,
} from "../utils/permissoes";
import PedidoDetalhe from "./pedidos/PedidoDetalhe";

const TIPOS_PEDIDO = ["Instalacao", "Manutencao Preventiva", "Manutencao Corretiva", "Misto"];

const FORM_INICIAL = {
    codigo_proposta: "",
    cliente_id: "",
    responsavel_producao_id: "",
    tipo_pedido: "Instalacao",
    status: "Aguardando",
    status_aprovacao: "Pendente",
    endereco_instalacao: "",
    condicoes_pagamento: "",
    data_previsao_fim: "",
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

    const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState(pedidoInicialId);

    // Modal Novo Pedido
    const [modalNovoAberto, setModalNovoAberto] = useState(false);
    const [formNovo, setFormNovo] = useState(FORM_INICIAL);
    const [erroNovo, setErroNovo] = useState("");
    const [salvandoNovo, setSalvandoNovo] = useState(false);

    // Exclusão
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
                ehAdm ? api.get("/usuarios") : Promise.resolve({ data: [] }),
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

    // Lista de técnicos/usuários disponíveis para atribuição (compatível com ADM e TECNICO)
    const tecnicosDisponiveis = useMemo(() => {
        const mapa = new Map();
        const add = (u) => {
            if (!u || !u.id) return;
            if (u.perfil === "CLIENTE") return;
            mapa.set(Number(u.id), {
                id: Number(u.id),
                nome_completo: u.nome_completo || u.nome || `Usuário #${u.id}`,
                perfil: u.perfil || "TECNICO",
            });
        };

        if (usuario) {
            add({
                id: usuario.id_usuario ?? usuario.id,
                nome_completo: usuario.nome_completo,
                perfil: obterPerfilUsuario(usuario),
            });
        }
        for (const u of usuariosSistema) add(u);
        for (const p of pedidos) {
            if (p.responsavel_producao) add(p.responsavel_producao);
            if (p.usuario_criador) add(p.usuario_criador);
        }
        return Array.from(mapa.values());
    }, [usuario, usuariosSistema, pedidos]);

    const pedidoSelecionado = useMemo(
        () => pedidos.find((p) => Number(p.id) === Number(pedidoSelecionadoId)) || null,
        [pedidos, pedidoSelecionadoId]
    );

    const pedidosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return pedidos.filter((p) => {
            if (somenteBloqueados && !p.bloqueio_fabricacao) return false;
            if (filtroTipo !== "TODOS" && p.tipo_pedido !== filtroTipo) return false;
            if (!termo) return true;
            const nomeCliente = String(p.cliente?.usuario?.nome_completo || "").toLowerCase();
            return (
                String(p.id).includes(termo) ||
                String(p.codigo_proposta || "").toLowerCase().includes(termo) ||
                String(p.numero_serie_porta || "").toLowerCase().includes(termo) ||
                nomeCliente.includes(termo)
            );
        });
    }, [pedidos, busca, filtroTipo, somenteBloqueados]);

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

        const usuarioCriadorId = Number(usuario?.id_usuario ?? usuario?.id);
        const payload = {
            codigo_proposta: formNovo.codigo_proposta.trim() || null,
            cliente_id: Number(formNovo.cliente_id),
            usuario_criador_id: usuarioCriadorId,
            responsavel_producao_id: formNovo.responsavel_producao_id
                ? Number(formNovo.responsavel_producao_id)
                : null,
            tipo_pedido: formNovo.tipo_pedido,
            status: formNovo.status,
            status_aprovacao: formNovo.status_aprovacao,
            endereco_instalacao: formNovo.endereco_instalacao.trim() || null,
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
            setSucessoMsg(`Pedido #${criado.codigo_proposta || criado.id} criado! Adicione os itens e realize a medição.`);
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
            setSucessoMsg(`Pedido #${pedidoExcluir.codigo_proposta || pedidoExcluir.id} removido.`);
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

    // Tela de Detalhes do Pedido selecionado
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
                            Novo Pedido / Orçamento
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

            {/* Barra de Filtros */}
            <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <TextField
                        size="small"
                        placeholder="Buscar por proposta, cliente ou nº de série..."
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

            {/* Conteúdo Principal */}
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
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Pedido / Proposta</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Comercial</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Medição</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Trava (RF08)</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Etapa</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Total</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Previsão</TableCell>
                                <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pedidosFiltrados.map((p) => {
                                const nomeCli = p.cliente?.usuario?.nome_completo || `Cliente #${p.cliente_id}`;
                                const medStatus = p.checklist_medicao?.status_aprovacao || "Não feita";

                                return (
                                    <TableRow
                                        key={p.id}
                                        hover
                                        sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}
                                    >
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                            #{p.codigo_proposta || p.id}
                                            {p.numero_serie_porta && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Série: {p.numero_serie_porta}
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
                                            {formatarMoedaBr(p.valor_total)}
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

            {/* Modal Criar Novo Pedido / Orçamento */}
            <Dialog open={modalNovoAberto} onClose={() => setModalNovoAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={criarNovoPedido}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PrecisionManufacturingIcon color="primary" />
                        Novo Pedido / Orçamento
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
                                        const cli = clientes.find((c) => Number(c.id) === Number(cliId));
                                        setFormNovo({
                                            ...formNovo,
                                            cliente_id: cliId,
                                            endereco_instalacao: cli?.endereco || formNovo.endereco_instalacao,
                                        });
                                    }}
                                >
                                    {clientes.map((c) => (
                                        <MenuItem key={c.id} value={String(c.id)}>
                                            {c.usuario?.nome_completo || `Cliente #${c.id}`} ({c.cnpj_cpf})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Código da Proposta (opcional)"
                                        placeholder="Ex: PROP-2026-001"
                                        value={formNovo.codigo_proposta}
                                        onChange={(e) =>
                                            setFormNovo({ ...formNovo, codigo_proposta: e.target.value })
                                        }
                                    />
                                </Grid>
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
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth>
                                        <InputLabel id="novo-ped-status-label">Etapa Inicial</InputLabel>
                                        <Select
                                            labelId="novo-ped-status-label"
                                            label="Etapa Inicial"
                                            value={formNovo.status}
                                            onChange={(e) => setFormNovo({ ...formNovo, status: e.target.value })}
                                        >
                                            <MenuItem value="Rascunho">Rascunho</MenuItem>
                                            <MenuItem value="Pendente">Pendente (Orçamento)</MenuItem>
                                            <MenuItem value="Aguardando">Aguardando</MenuItem>
                                            <MenuItem value="Planejada">Planejada</MenuItem>
                                        </Select>
                                    </FormControl>
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

                            <FormControl fullWidth>
                                <InputLabel id="novo-ped-resp-label">Responsável pela Produção (opcional)</InputLabel>
                                <Select
                                    labelId="novo-ped-resp-label"
                                    label="Responsável pela Produção (opcional)"
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

                            <TextField
                                fullWidth
                                label="Condições de Pagamento"
                                placeholder="Ex: 50% entrada + 50% conclusão"
                                value={formNovo.condicoes_pagamento}
                                onChange={(e) =>
                                    setFormNovo({ ...formNovo, condicoes_pagamento: e.target.value })
                                }
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalNovoAberto(false)} color="inherit" disabled={salvandoNovo}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={salvandoNovo}>
                            {salvandoNovo ? <CircularProgress size={22} color="inherit" /> : "Criar e Abrir Detalhes"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmação de Exclusão */}
            <Dialog open={Boolean(pedidoExcluir)} onClose={() => setPedidoExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente excluir o pedido{" "}
                        <strong>#{pedidoExcluir?.codigo_proposta || pedidoExcluir?.id}</strong>?
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
