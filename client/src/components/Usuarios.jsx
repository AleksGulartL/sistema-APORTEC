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
    FormControlLabel,
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
    cargo_funcao: "",
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

    // Modal de criação / edição
    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
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

    const usuariosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return usuarios.filter((u) => {
            if (filtroPerfil !== "TODOS" && u.perfil !== filtroPerfil) return false;
            if (!termo) return true;
            return (
                String(u.nome_completo || "").toLowerCase().includes(termo) ||
                String(u.email || "").toLowerCase().includes(termo) ||
                String(u.cargo_funcao || "").toLowerCase().includes(termo)
            );
        });
    }, [usuarios, busca, filtroPerfil]);

    function abrirNovoUsuario() {
        setModoEdicao(false);
        setForm(FORM_INICIAL);
        setMostrarSenha(false);
        setErroModal("");
        setModalAberto(true);
    }

    function abrirEdicao(registro) {
        setModoEdicao(true);
        setForm({
            id: registro.id ?? registro.id_usuario,
            nome_completo: registro.nome_completo || "",
            email: registro.email || "",
            perfil: registro.perfil || "TECNICO",
            cargo_funcao: registro.cargo_funcao || "",
            senha: "",
            ativo: registro.ativo !== false,
        });
        setMostrarSenha(false);
        setErroModal("");
        setModalAberto(true);
    }

    async function salvarUsuario(event) {
        event.preventDefault();
        setErroModal("");
        setSalvando(true);

        try {
            if (modoEdicao) {
                const payload = {
                    nome_completo: form.nome_completo.trim(),
                    email: form.email.trim(),
                    perfil: form.perfil,
                    cargo_funcao: form.cargo_funcao.trim() || form.perfil,
                    ativo: form.ativo,
                };
                if (form.senha.trim()) {
                    payload.senha = form.senha;
                }
                await api.put(`/usuarios/${form.id}`, payload);
                setSucessoMsg("Usuário atualizado com sucesso!");
            } else {
                // Usa /auth/registrar autenticado como ADM para criar usuário já com hash bcrypt
                await api.post("/auth/registrar", {
                    nome_completo: form.nome_completo.trim(),
                    email: form.email.trim(),
                    senha: form.senha,
                    perfil: form.perfil,
                    cargo_funcao: form.cargo_funcao.trim() || form.perfil,
                });
                setSucessoMsg("Usuário cadastrado com sucesso!");
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
                        Usuários do Sistema
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Cadastro, alteração de perfis (ADM, TECNICO, CLIENTE) e controle de acesso (RF01)
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={abrirNovoUsuario}
                    >
                        Novo Usuário
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

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {["TODOS", "ADM", "TECNICO", "CLIENTE"].map((p) => (
                            <Chip
                                key={p}
                                size="small"
                                label={
                                    p === "TODOS"
                                        ? `Todos (${usuarios.length})`
                                        : `${p} (${usuarios.filter((u) => u.perfil === p).length})`
                                }
                                color={filtroPerfil === p ? COR_PERFIL[p] || "primary" : "default"}
                                variant={filtroPerfil === p ? "filled" : "outlined"}
                                onClick={() => setFiltroPerfil(p)}
                            />
                        ))}
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
                        Nenhum usuário encontrado.
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
                                <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cargo / Função</TableCell>
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
                                        <TableCell>{u.cargo_funcao || "-"}</TableCell>
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

            {/* Modal Criar / Editar Usuário */}
            <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarUsuario}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <ManageAccountsIcon color="primary" />
                        {modoEdicao ? "Editar Usuário" : "Cadastrar Novo Usuário"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {erroModal && <Alert severity="error">{erroModal}</Alert>}

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
                                type="email"
                                label="E-mail"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <FormControl fullWidth required>
                                <InputLabel id="perfil-select-label">Perfil de Acesso</InputLabel>
                                <Select
                                    labelId="perfil-select-label"
                                    label="Perfil de Acesso"
                                    value={form.perfil}
                                    onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                                >
                                    <MenuItem value="ADM">ADM — Acesso total (administrativo e financeiro)</MenuItem>
                                    <MenuItem value="TECNICO">
                                        TECNICO — Operação em campo (medições, OS, consultas)
                                    </MenuItem>
                                    <MenuItem value="CLIENTE">CLIENTE — Cadastro externo (sem acesso interno)</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="Cargo / Função (descrição)"
                                placeholder="Ex: Gerente de Produção, Instalador, Comercial"
                                value={form.cargo_funcao}
                                onChange={(e) => setForm({ ...form, cargo_funcao: e.target.value })}
                            />
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
                                            <IconButton
                                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                                edge="end"
                                            >
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
                                    label={form.ativo ? "Usuário Ativo" : "Usuário Inativo"}
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
