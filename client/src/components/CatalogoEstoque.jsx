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
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../services/api";
import { formatarMoedaBr, obterPerfilUsuario, usuarioEhAdm, usuarioEhFuncionario } from "../utils/permissoes";

const TIPOS_ITEM = ["Insumo", "Porta", "Peca", "Material", "Servico"];

const UNIDADES_SUGERIDAS = ["UN", "PC", "M", "M2", "KIT", "KG", "PAR"];

const FORM_INICIAL = {
    id: null,
    codigo_referencia: "",
    tipo: "Insumo",
    categoria: "GERAL",
    descricao: "",
    unidade_medida: "UN",
    valor_unitario_padrao: "0",
    quantidade_estoque: "0",
    estoque_minimo: "0",
};

export default function CatalogoEstoque({ usuario }) {
    const ehAdm = usuarioEhAdm(usuario);
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [itens, setItens] = useState([]);
    const [alertasApi, setAlertasApi] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [somenteAlertas, setSomenteAlertas] = useState(false);

    // Modal Criar / Editar
    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [erroModal, setErroModal] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Modal Movimentação (Entrada / Baixa)
    const [itemMov, setItemMov] = useState(null);
    const [tipoMov, setTipoMov] = useState("ENTRADA");
    const [qtdMov, setQtdMov] = useState("1");
    const [erroMov, setErroMov] = useState("");
    const [salvandoMov, setSalvandoMov] = useState(false);

    // Confirmação de exclusão
    const [itemExcluir, setItemExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregarDados = useCallback(async () => {
        if (!ehFuncionario) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro("");
        try {
            const [resItens, resAlertas] = await Promise.allSettled([
                api.get("/item_catalogo"),
                ehAdm ? api.get("/item_catalogo/alertas-estoque") : Promise.resolve({ data: null }),
            ]);

            if (resItens.status === "rejected") {
                setErro(resItens.reason?.response?.data?.erro || "Erro ao carregar catálogo e estoque.");
                return;
            }

            const lista = Array.isArray(resItens.value.data) ? resItens.value.data : [];
            setItens(lista);

            if (ehAdm && resAlertas.status === "fulfilled" && Array.isArray(resAlertas.value.data)) {
                setAlertasApi(resAlertas.value.data);
            } else {
                setAlertasApi(
                    lista.filter((it) => Number(it.quantidade_atual ?? 0) <= Number(it.estoque_minimo ?? 0))
                );
            }
        } catch (err) {
            console.error("Erro ao carregar catálogo:", err);
            setErro("Erro inesperado ao consultar catálogo e estoque.");
        } finally {
            setCarregando(false);
        }
    }, [ehAdm, ehFuncionario]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    const itensCriticos = useMemo(() => {
        if (ehAdm && alertasApi.length > 0) return alertasApi;
        return itens.filter((it) => Number(it.quantidade_atual ?? 0) <= Number(it.estoque_minimo ?? 0));
    }, [ehAdm, alertasApi, itens]);

    const valorTotalEstoque = useMemo(
        () =>
            itens.reduce(
                (acc, it) => acc + Number(it.quantidade_atual ?? 0) * Number(it.valor_unitario_padrao ?? 0),
                0
            ),
        [itens]
    );

    const itensFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return itens.filter((it) => {
            const critico = Number(it.quantidade_atual ?? 0) <= Number(it.estoque_minimo ?? 0);
            if (somenteAlertas && !critico) return false;
            if (filtroTipo !== "TODOS" && String(it.tipo).toLowerCase() !== filtroTipo.toLowerCase()) return false;
            if (!termo) return true;
            return (
                String(it.codigo_referencia || "").toLowerCase().includes(termo) ||
                String(it.descricao || "").toLowerCase().includes(termo) ||
                String(it.categoria || "").toLowerCase().includes(termo) ||
                String(it.tipo || "").toLowerCase().includes(termo)
            );
        });
    }, [itens, busca, filtroTipo, somenteAlertas]);

    function abrirNovoItem() {
        setModoEdicao(false);
        setForm(FORM_INICIAL);
        setErroModal("");
        setModalAberto(true);
    }

    function abrirEdicao(item) {
        setModoEdicao(true);
        setForm({
            id: item.id ?? item.id_item,
            codigo_referencia: item.codigo_referencia || "",
            tipo: item.tipo || "Insumo",
            categoria: item.categoria || "GERAL",
            descricao: item.descricao || "",
            unidade_medida: item.unidade_medida || "UN",
            valor_unitario_padrao: String(item.valor_unitario_padrao ?? 0),
            quantidade_estoque: String(item.quantidade_atual ?? item.quantidade_estoque ?? 0),
            estoque_minimo: String(item.estoque_minimo ?? 0),
        });
        setErroModal("");
        setModalAberto(true);
    }

    async function salvarItem(event) {
        event.preventDefault();
        setErroModal("");

        const valorUnit = Number(form.valor_unitario_padrao);
        const qtdAtual = Number(form.quantidade_estoque);
        const estMin = Number(form.estoque_minimo);

        if (isNaN(valorUnit) || valorUnit < 0) {
            setErroModal("O valor unitário padrão deve ser maior ou igual a zero.");
            return;
        }
        if (isNaN(qtdAtual) || qtdAtual < 0) {
            setErroModal("A quantidade atual em estoque deve ser maior ou igual a zero.");
            return;
        }
        if (isNaN(estMin) || estMin < 0) {
            setErroModal("O estoque mínimo deve ser maior ou igual a zero.");
            return;
        }

        const payload = {
            codigo_referencia: form.codigo_referencia.trim() || null,
            tipo: form.tipo,
            categoria: form.categoria.trim() || "GERAL",
            descricao: form.descricao.trim(),
            unidade_medida: form.unidade_medida.trim() || "UN",
            valor_unitario_padrao: valorUnit,
            quantidade_estoque: qtdAtual,
            quantidade_atual: qtdAtual,
            estoque_minimo: estMin,
        };

        setSalvando(true);
        try {
            if (modoEdicao) {
                await api.put(`/item_catalogo/${form.id}`, payload);
                setSucessoMsg("Item do catálogo atualizado com sucesso!");
            } else {
                await api.post("/item_catalogo", payload);
                setSucessoMsg("Item cadastrado no catálogo com sucesso!");
            }
            setModalAberto(false);
            carregarDados();
        } catch (err) {
            console.error("Erro ao salvar item do catálogo:", err);
            setErroModal(err.response?.data?.erro || "Erro ao salvar item do catálogo.");
        } finally {
            setSalvando(false);
        }
    }

    function abrirMovimentacao(item, modoInicial = "ENTRADA") {
        setItemMov(item);
        setTipoMov(modoInicial);
        setQtdMov("1");
        setErroMov("");
    }

    const saldoPrevisto = useMemo(() => {
        if (!itemMov) return 0;
        const atual = Number(itemMov.quantidade_atual ?? itemMov.quantidade_estoque ?? 0);
        const delta = Number(qtdMov);
        if (isNaN(delta) || delta <= 0) return atual;
        return tipoMov === "ENTRADA" ? Number((atual + delta).toFixed(2)) : Number((atual - delta).toFixed(2));
    }, [itemMov, tipoMov, qtdMov]);

    async function confirmarMovimentacao(event) {
        event.preventDefault();
        if (!itemMov) return;
        setErroMov("");

        const delta = Number(qtdMov);
        if (isNaN(delta) || delta <= 0) {
            setErroMov("Informe uma quantidade maior que zero para movimentar.");
            return;
        }
        if (saldoPrevisto < 0) {
            setErroMov("A baixa solicitada excede o saldo disponível em estoque.");
            return;
        }

        const id = itemMov.id ?? itemMov.id_item;
        const payload = {
            codigo_referencia: itemMov.codigo_referencia || null,
            tipo: itemMov.tipo,
            categoria: itemMov.categoria || "GERAL",
            descricao: itemMov.descricao,
            unidade_medida: itemMov.unidade_medida,
            valor_unitario_padrao: Number(itemMov.valor_unitario_padrao ?? 0),
            quantidade_estoque: saldoPrevisto,
            quantidade_atual: saldoPrevisto,
            estoque_minimo: Number(itemMov.estoque_minimo ?? 0),
        };

        setSalvandoMov(true);
        try {
            await api.put(`/item_catalogo/${id}`, payload);
            setSucessoMsg(
                `${tipoMov === "ENTRADA" ? "Entrada" : "Baixa"} de ${delta} ${itemMov.unidade_medida} registrada para "${itemMov.descricao}". Novo saldo: ${saldoPrevisto}.`
            );
            setItemMov(null);
            carregarDados();
        } catch (err) {
            console.error("Erro ao movimentar estoque:", err);
            setErroMov(err.response?.data?.erro || "Erro ao registrar movimentação de estoque.");
        } finally {
            setSalvandoMov(false);
        }
    }

    async function confirmarExclusao() {
        if (!itemExcluir) return;
        setExcluindo(true);
        try {
            const id = itemExcluir.id ?? itemExcluir.id_item;
            await api.delete(`/item_catalogo/${id}`);
            setSucessoMsg(`Item "${itemExcluir.descricao}" removido do catálogo.`);
            setItemExcluir(null);
            carregarDados();
        } catch (err) {
            console.error("Erro ao excluir item:", err);
            setErro(err.response?.data?.erro || "Não foi possível excluir este item (pode estar vinculado a pedidos).");
            setItemExcluir(null);
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
                        Catálogo e Estoque
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {ehAdm
                            ? "Cadastro de itens, entrada/baixa de saldo e alertas de estoque mínimo (RF10, RF11)"
                            : "Consulta de catálogo, preços de referência e saldos disponíveis em estoque (RF10, RF11)"}
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
                    {ehAdm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovoItem}>
                            Novo Item
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

            {/* Banner de Alerta de Estoque Mínimo */}
            {!carregando && itensCriticos.length > 0 && (
                <Alert
                    severity="warning"
                    icon={<WarningAmberIcon />}
                    sx={{ mb: 2 }}
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => setSomenteAlertas((prev) => !prev)}
                        >
                            {somenteAlertas ? "Ver Todos" : "Filtrar Críticos"}
                        </Button>
                    }
                >
                    <strong>{itensCriticos.length} item(ns)</strong> atingiram ou estão abaixo do estoque mínimo definido.
                </Alert>
            )}

            {/* Resumo Rápido */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Itens no Catálogo
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {itens.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Alertas de Estoque Mínimo
                            </Typography>
                            <Typography
                                variant="h4"
                                fontWeight="bold"
                                color={itensCriticos.length > 0 ? "error.main" : "success.main"}
                            >
                                {itensCriticos.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Valor Estimado em Estoque
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary.main">
                                {formatarMoedaBr(valorTotalEstoque)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <TextField
                        size="small"
                        placeholder="Buscar por código, descrição ou categoria..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        sx={{ minWidth: { xs: "100%", md: 320 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                        <Chip
                            size="small"
                            label={`Todos (${itens.length})`}
                            color={filtroTipo === "TODOS" && !somenteAlertas ? "primary" : "default"}
                            variant={filtroTipo === "TODOS" && !somenteAlertas ? "filled" : "outlined"}
                            onClick={() => {
                                setFiltroTipo("TODOS");
                                setSomenteAlertas(false);
                            }}
                        />
                        {TIPOS_ITEM.map((t) => {
                            const qtd = itens.filter(
                                (it) => String(it.tipo).toLowerCase() === t.toLowerCase()
                            ).length;
                            return (
                                <Chip
                                    key={t}
                                    size="small"
                                    label={`${t} (${qtd})`}
                                    color={filtroTipo === t ? "primary" : "default"}
                                    variant={filtroTipo === t ? "filled" : "outlined"}
                                    onClick={() => setFiltroTipo(filtroTipo === t ? "TODOS" : t)}
                                />
                            );
                        })}
                        <Chip
                            size="small"
                            icon={<WarningAmberIcon />}
                            label={`Abaixo do Mínimo (${itensCriticos.length})`}
                            color={somenteAlertas ? "error" : "default"}
                            variant={somenteAlertas ? "filled" : "outlined"}
                            onClick={() => setSomenteAlertas((prev) => !prev)}
                        />
                    </Stack>
                </Stack>
            </Card>

            {/* Tabela */}
            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : itensFiltrados.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Nenhum item encontrado no catálogo para os filtros aplicados.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table sx={{ minWidth: 780 }} aria-label="tabela de catálogo e estoque">
                        <TableHead sx={{ bgcolor: "primary.main" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Código</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo / Categoria</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Descrição</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Valor Unit.</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Saldo Atual</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Est. Mínimo</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Situação</TableCell>
                                {ehAdm && (
                                    <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                        Ações
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {itensFiltrados.map((item) => {
                                const id = item.id ?? item.id_item;
                                const atual = Number(item.quantidade_atual ?? item.quantidade_estoque ?? 0);
                                const minimo = Number(item.estoque_minimo ?? 0);
                                const critico = atual <= minimo;

                                return (
                                    <TableRow
                                        key={id}
                                        hover
                                        sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}
                                    >
                                        <TableCell sx={{ fontWeight: "medium" }}>{id}</TableCell>
                                        <TableCell>{item.codigo_referencia || "-"}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                                <Chip size="small" label={item.tipo} color="primary" variant="outlined" />
                                                <Typography variant="caption" color="text.secondary">
                                                    {item.categoria || "GERAL"}
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "medium" }}>{item.descricao}</TableCell>
                                        <TableCell>{formatarMoedaBr(item.valor_unitario_padrao)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={critico ? "error" : "default"}
                                                label={`${atual} ${item.unidade_medida}`}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {minimo} {item.unidade_medida}
                                        </TableCell>
                                        <TableCell>
                                            {critico ? (
                                                <Chip
                                                    size="small"
                                                    icon={<WarningAmberIcon />}
                                                    color="error"
                                                    variant="outlined"
                                                    label="Reposição"
                                                />
                                            ) : (
                                                <Chip
                                                    size="small"
                                                    icon={<CheckCircleIcon />}
                                                    color="success"
                                                    variant="outlined"
                                                    label="Normal"
                                                />
                                            )}
                                        </TableCell>
                                        {ehAdm && (
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Entrada / Baixa de Estoque">
                                                        <IconButton
                                                            color="secondary"
                                                            size="small"
                                                            onClick={() => abrirMovimentacao(item, "ENTRADA")}
                                                        >
                                                            <SwapVertIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Editar Item">
                                                        <IconButton
                                                            color="primary"
                                                            size="small"
                                                            onClick={() => abrirEdicao(item)}
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Excluir Item">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => setItemExcluir(item)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal Criar / Editar Item */}
            <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarItem}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Inventory2Icon color="primary" />
                        {modoEdicao ? "Editar Item do Catálogo" : "Novo Item no Catálogo"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroModal && <Alert severity="error">{erroModal}</Alert>}

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="tipo-item-label">Tipo</InputLabel>
                                        <Select
                                            labelId="tipo-item-label"
                                            label="Tipo"
                                            value={form.tipo}
                                            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                                        >
                                            {TIPOS_ITEM.map((t) => (
                                                <MenuItem key={t} value={t}>
                                                    {t}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Código de Referência"
                                        placeholder="Ex: MOT-SLIM-200"
                                        value={form.codigo_referencia}
                                        onChange={(e) => setForm({ ...form, codigo_referencia: e.target.value })}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Categoria"
                                        placeholder="Ex: Automatizador, Vidro, Perfil"
                                        value={form.categoria}
                                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel id="unidade-medida-label">Unidade de Medida</InputLabel>
                                        <Select
                                            labelId="unidade-medida-label"
                                            label="Unidade de Medida"
                                            value={
                                                UNIDADES_SUGERIDAS.includes(form.unidade_medida)
                                                    ? form.unidade_medida
                                                    : "UN"
                                            }
                                            onChange={(e) => setForm({ ...form, unidade_medida: e.target.value })}
                                        >
                                            {UNIDADES_SUGERIDAS.map((u) => (
                                                <MenuItem key={u} value={u}>
                                                    {u}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <TextField
                                required
                                fullWidth
                                multiline
                                rows={2}
                                label="Descrição do Item"
                                placeholder="Ex: Automatizador APORTEC Slim 200kg c/ central digital"
                                value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                            />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        inputProps={{ min: 0, step: "0.01" }}
                                        label="Valor Unitário (R$)"
                                        value={form.valor_unitario_padrao}
                                        onChange={(e) =>
                                            setForm({ ...form, valor_unitario_padrao: e.target.value })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        inputProps={{ min: 0, step: "0.01" }}
                                        label="Saldo Atual"
                                        value={form.quantidade_estoque}
                                        onChange={(e) =>
                                            setForm({ ...form, quantidade_estoque: e.target.value })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="number"
                                        inputProps={{ min: 0, step: "0.01" }}
                                        label="Estoque Mínimo"
                                        value={form.estoque_minimo}
                                        onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalAberto(false)} color="inherit" disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" disabled={salvando}>
                            {salvando ? <CircularProgress size={22} color="inherit" /> : "Salvar Item"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Modal Entrada / Baixa Rápida de Estoque */}
            <Dialog open={Boolean(itemMov)} onClose={() => setItemMov(null)} maxWidth="xs" fullWidth>
                <form onSubmit={confirmarMovimentacao}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SwapVertIcon color="secondary" />
                        Movimentar Estoque
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroMov && <Alert severity="error">{erroMov}</Alert>}

                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {itemMov?.descricao}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Saldo atual: {itemMov?.quantidade_atual ?? 0} {itemMov?.unidade_medida} • Mínimo:{" "}
                                    {itemMov?.estoque_minimo ?? 0} {itemMov?.unidade_medida}
                                </Typography>
                            </Box>

                            <ToggleButtonGroup
                                fullWidth
                                exclusive
                                value={tipoMov}
                                onChange={(_, val) => {
                                    if (val) setTipoMov(val);
                                }}
                            >
                                <ToggleButton value="ENTRADA" color="success">
                                    <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Entrada (+)
                                </ToggleButton>
                                <ToggleButton value="BAIXA" color="error">
                                    <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Baixa (-)
                                </ToggleButton>
                            </ToggleButtonGroup>

                            <TextField
                                required
                                fullWidth
                                type="number"
                                inputProps={{ min: 0.01, step: "0.01" }}
                                label={`Quantidade (${itemMov?.unidade_medida || "UN"})`}
                                value={qtdMov}
                                onChange={(e) => setQtdMov(e.target.value)}
                            />

                            <Alert
                                severity={
                                    saldoPrevisto < 0
                                        ? "error"
                                        : saldoPrevisto <= Number(itemMov?.estoque_minimo ?? 0)
                                          ? "warning"
                                          : "info"
                                }
                            >
                                Novo saldo previsto:{" "}
                                <strong>
                                    {saldoPrevisto} {itemMov?.unidade_medida}
                                </strong>
                                {saldoPrevisto < 0 && " — Saldo insuficiente!"}
                            </Alert>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setItemMov(null)} color="inherit" disabled={salvandoMov}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color={tipoMov === "ENTRADA" ? "success" : "error"}
                            disabled={salvandoMov || saldoPrevisto < 0}
                        >
                            {salvandoMov ? <CircularProgress size={20} color="inherit" /> : "Confirmar"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmação de Exclusão */}
            <Dialog open={Boolean(itemExcluir)} onClose={() => setItemExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente remover o item <strong>{itemExcluir?.descricao}</strong> do catálogo?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setItemExcluir(null)} color="inherit" disabled={excluindo}>
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
