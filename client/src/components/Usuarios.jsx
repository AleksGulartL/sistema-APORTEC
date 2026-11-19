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
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
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
import EditIcon from "@mui/icons-material/Edit";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../services/api";
import { usuarioEhAdm } from "../utils/permissoes";
import {
    emailEhGmail,
    MENSAGEM_ERRO_GMAIL,
    normalizarEmailGmail,
    obterAjudaEmailGmail,
} from "../utils/validacoes";

const COR_PERFIL = {
    ADM: "error",
    TECNICO: "warning",
    CLIENTE: "default",
};

const FORM_INICIAL = {
    id: null,
    nome_completo: "",
    email: "",
    perfil: "TECNICO",
    senha: "",
    ativo: true,
};

export default function Usuarios({ usuario }) {
    const ehAdm = usuarioEhAdm(usuario);
    const idLogado = usuario?.id_usuario ?? usuario?.id ?? null;

    const [usuarios, setUsuarios] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");
    const [busca, setBusca] = useState("");
    const [filtroPerfil, setFiltroPerfil] = useState("TODOS");
    const [incluirClientes, setIncluirClientes] = useState(false);

    // Modal de criação / edição
    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [emailTocado, setEmailTocado] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [erroModal, setErroModal] = useState("");
    const [salvando, setSalvando] = useState(false);

    // Confirmação de exclusão
    const [usuarioExcluir, setUsuarioExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregarUsuarios = useCallback(async () => {
        if (!ehAdm) {
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErro("");
        try {
            const response = await api.get("/usuarios");
            setUsuarios(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Erro ao listar usuários:", err);
            setErro(err.response?.data?.erro || "Erro ao carregar a lista de usuários.");
        } finally {
            setCarregando(false);
        }
    }, [ehAdm]);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]);

    const colaboradoresInternos = useMemo(
        () => usuarios.filter((u) => u.perfil !== "CLIENTE"),
        [usuarios]
    );

    const usuariosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return usuarios.filter((u) => {
            if (!incluirClientes && u.perfil === "CLIENTE") return false;
            if (filtroPerfil !== "TODOS" && u.perfil !== filtroPerfil) return false;
            if (!termo) return true;
            return (
                String(u.nome_completo || "").toLowerCase().includes(termo) ||
                String(u.email || "").toLowerCase().includes(termo)
            );
        });
    }, [usuarios, busca, filtroPerfil, incluirClientes]);

    function abrirNovoUsuario() {
        setModoEdicao(false);
        setForm(FORM_INICIAL);
        setEmailTocado(false);
        setMostrarSenha(false);
        setErroModal("");
        setModalAberto(true);
    }

    function abrirEdicao(registro) {
        const emailAtual = registro.email || "";
        setModoEdicao(true);
        setForm({
            id: registro.id ?? registro.id_usuario,
            nome_completo: registro.nome_completo || "",
            email: emailAtual,
            perfil: registro.perfil || "TECNICO",
            senha: "",
            ativo: registro.ativo !== false,
        });
        setEmailTocado(Boolean(emailAtual.trim()) && !emailEhGmail(emailAtual));
        setMostrarSenha(false);
        setErroModal("");
        setModalAberto(true);
    }

    async function salvarUsuario(event) {
        event.preventDefault();
        setErroModal("");

        if (!emailEhGmail(form.email)) {
            setEmailTocado(true);
            setErroModal(MENSAGEM_ERRO_GMAIL);
            return;
        }

        setSalvando(true);
        const emailNormalizado = normalizarEmailGmail(form.email);

        try {
            if (modoEdicao) {
                const payload = {
                    nome_completo: form.nome_completo.trim(),
                    email: emailNormalizado,
                    perfil: form.perfil,
                    ativo: form.ativo,
                };
                if (form.senha.trim()) {
                    payload.senha = form.senha.trim();
                }
                await api.put(`/usuarios/${form.id}`, payload);
                setSucessoMsg("Colaborador atualizado com sucesso!");
            } else {
                await api.post("/auth/registrar", {
                    nome_completo: form.nome_completo.trim(),
                    email: emailNormalizado,
                    senha: form.senha,
                    perfil: form.perfil,
                });
                setSucessoMsg(`Usuário "${form.nome_completo.trim()}" cadastrado com perfil ${form.perfil}!`);
            }

            setModalAberto(false);
            carregarUsuarios();
        } catch (err) {
            console.error("Erro ao salvar usuário:", err);
            setErroModal(err.response?.data?.erro || "Erro ao salvar usuário.");
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarExclusao() {
        if (!usuarioExcluir) return;
        setExcluindo(true);
        try {
            const id = usuarioExcluir.id ?? usuarioExcluir.id_usuario;
            await api.delete(`/usuarios/${id}`);
            setSucessoMsg(`Usuário "${usuarioExcluir.nome_completo}" removido com sucesso.`);
            setUsuarioExcluir(null);
            carregarUsuarios();
        } catch (err) {
            console.error("Erro ao excluir usuário:", err);
            setErro(err.response?.data?.erro || "Erro ao excluir usuário.");
            setUsuarioExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    if (!ehAdm) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="error">
                    Acesso negado: o gerenciamento de usuários é exclusivo do perfil Administrador (ADM).
                </Alert>
            </Box>
        );
    }

    const totalAdmins = colaboradoresInternos.filter((u) => u.perfil === "ADM").length;
    const totalTecnicos = colaboradoresInternos.filter((u) => u.perfil === "TECNICO").length;

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
                        Equipe e Usuários Internos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie colaboradores (Administradores e Técnicos). Contas de clientes são criadas na aba Clientes.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={carregarUsuarios}
                        disabled={carregando}
                    >
                        Atualizar
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovoUsuario}>
                        Novo Colaborador
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

            {/* Resumo */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Colaboradores Internos
                            </Typography>
                            <Typography variant="h4" fontWeight="bold">
                                {colaboradoresInternos.length}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Administradores (ADM)
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="error.main">
                                {totalAdmins}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Técnicos (TECNICO)
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {totalTecnicos}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", md: "center" }}
                >
                    <TextField
                        size="small"
                        placeholder="Filtrar por nome, e-mail ou cargo..."
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

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                        {["TODOS", "ADM", "TECNICO"].map((p) => (
                            <Chip
                                key={p}
                                size="small"
                                label={
                                    p === "TODOS"
                                        ? `Equipe (${colaboradoresInternos.length})`
                                        : `${p} (${colaboradoresInternos.filter((u) => u.perfil === p).length})`
                                }
                                color={filtroPerfil === p ? COR_PERFIL[p] || "primary" : "default"}
                                variant={filtroPerfil === p ? "filled" : "outlined"}
                                onClick={() => setFiltroPerfil(p)}
                            />
                        ))}
                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={incluirClientes}
                                    onChange={(e) => {
                                        setIncluirClientes(e.target.checked);
                                        if (!e.target.checked && filtroPerfil === "CLIENTE") {
                                            setFiltroPerfil("TODOS");
                                        }
                                    }}
                                />
                            }
                            label={<Typography variant="caption">Mostrar acessos de Clientes</Typography>}
                        />
                    </Stack>
                </Stack>
            </Card>

            {carregando ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : usuariosFiltrados.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Nenhum usuário encontrado para os filtros atuais.
                    </Typography>
                </Paper>
            ) : (
                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table sx={{ minWidth: 650 }} aria-label="tabela de usuários">
                        <TableHead sx={{ bgcolor: "primary.main" }}>
                            <TableRow>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nome Completo</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>E-mail</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Perfil</TableCell>
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Situação</TableCell>
                                <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                    Ações
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usuariosFiltrados.map((u) => {
                                const id = u.id ?? u.id_usuario;
                                const ehProprioUsuario = Number(id) === Number(idLogado);
                                return (
                                    <TableRow
                                        key={id}
                                        hover
                                        sx={{ "&:nth-of-type(odd)": { bgcolor: "action.hover" } }}
                                    >
                                        <TableCell sx={{ fontWeight: "medium" }}>{id}</TableCell>
                                        <TableCell sx={{ fontWeight: "medium" }}>
                                            {u.nome_completo}
                                            {ehProprioUsuario && (
                                                <Chip size="small" label="Você" variant="outlined" sx={{ ml: 1 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={u.perfil}
                                                color={COR_PERFIL[u.perfil] || "default"}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                color={u.ativo !== false ? "success" : "default"}
                                                label={u.ativo !== false ? "Ativo" : "Inativo"}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Editar Usuário">
                                                <IconButton
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => abrirEdicao(u)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip
                                                title={
                                                    ehProprioUsuario
                                                        ? "Você não pode excluir a própria conta logada"
                                                        : "Excluir Usuário"
                                                }
                                            >
                                                <span>
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        disabled={ehProprioUsuario}
                                                        onClick={() => setUsuarioExcluir(u)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Modal Criar / Editar Colaborador */}
            <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarUsuario}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ManageAccountsIcon color="primary" />
                        {modoEdicao ? "Editar Usuário" : "Cadastrar Novo Colaborador"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 0.5 }}>
                            {erroModal && <Alert severity="error">{erroModal}</Alert>}

                            {modoEdicao && form.perfil === "CLIENTE" ? (
                                <Alert severity="info">
                                    Esta conta pertence a um Cliente cadastrado. Para alterar dados comerciais (CNPJ/CPF,
                                    telefone ou endereço) utilize a aba <strong>Clientes</strong>.
                                </Alert>
                            ) : (
                                <Alert severity="info" variant="outlined">
                                    <strong>ADM:</strong> acesso total ao sistema. <strong>TECNICO:</strong> medições,
                                    andamento de produção, OS e prontuários.
                                </Alert>
                            )}

                            <TextField
                                required
                                fullWidth
                                label="Nome Completo"
                                value={form.nome_completo}
                                onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
                            />
                            <TextField
                                required
                                fullWidth
                                type="text"
                                label="E-mail de Acesso"
                                placeholder="nome@gmail.com"
                                autoComplete="email"
                                inputProps={{ inputMode: "email" }}
                                value={form.email}
                                onChange={(e) => {
                                    const novoEmail = e.target.value;
                                    setForm({ ...form, email: novoEmail });
                                    if (erroModal === MENSAGEM_ERRO_GMAIL && emailEhGmail(novoEmail)) {
                                        setErroModal("");
                                    }
                                }}
                                onBlur={() => setEmailTocado(true)}
                                {...obterAjudaEmailGmail(form.email, emailTocado)}
                            />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    {modoEdicao && form.perfil === "CLIENTE" ? (
                                        <TextField fullWidth label="Perfil de Acesso" value="CLIENTE" disabled />
                                    ) : (
                                        <FormControl fullWidth required>
                                            <InputLabel id="perfil-select-label">Perfil de Acesso</InputLabel>
                                            <Select
                                                labelId="perfil-select-label"
                                                label="Perfil de Acesso"
                                                value={form.perfil}
                                                onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                                            >
                                                <MenuItem value="TECNICO">TECNICO — Equipe Técnica / Campo</MenuItem>
                                                <MenuItem value="ADM">ADM — Administrador Geral</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                </Grid>
                            </Grid>

                            <TextField
                                required={!modoEdicao}
                                fullWidth
                                label={modoEdicao ? "Nova Senha (deixe em branco para manter)" : "Senha Inicial"}
                                type={mostrarSenha ? "text" : "password"}
                                value={form.senha}
                                onChange={(e) => setForm({ ...form, senha: e.target.value })}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setMostrarSenha(!mostrarSenha)} edge="end">
                                                {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {modoEdicao && (
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={form.ativo}
                                            onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                                        />
                                    }
                                    label={form.ativo ? "Conta Ativa" : "Conta Inativa (login bloqueado)"}
                                />
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalAberto(false)} color="inherit" disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={salvando}>
                            {salvando ? <CircularProgress size={22} color="inherit" /> : "Salvar"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmação de Exclusão */}
            <Dialog open={Boolean(usuarioExcluir)} onClose={() => setUsuarioExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente remover o usuário{" "}
                        <strong>{usuarioExcluir?.nome_completo}</strong> ({usuarioExcluir?.email})?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUsuarioExcluir(null)} color="inherit" disabled={excluindo}>
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
