import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BusinessIcon from "@mui/icons-material/Business";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PersonIcon from "@mui/icons-material/Person";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import Tabela from "./Tabela";
import api from "../services/api";
import { usuarioEhAdm, usuarioEhFuncionario } from "../utils/permissoes";
import {
    emailEhValido,
    MENSAGEM_ERRO_EMAIL,
    normalizarEmail,
    obterAjudaEmail,
} from "../utils/validacoes";

function gerarSenhaSugerida() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `Aportec@${num}`;
}

const FORM_INICIAL = {
    usuario_id: null,
    nome_completo: "",
    cnpj_cpf: "",
    telefone: "",
    email: "",
    endereco: "",
    senha: "",
};

export default function Clientes({ usuario }) {
    const ehAdm = usuarioEhAdm(usuario);
    const ehFuncionario = usuarioEhFuncionario(usuario);

    const [clienteSelecionado, setClienteSelecionado] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [busca, setBusca] = useState("");
    const [erro, setErro] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");
    const [carregando, setCarregando] = useState(false);

    const [credenciaisProntas, setCredenciaisProntas] = useState(null);
    const [copiado, setCopiado] = useState(false);

    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [form, setForm] = useState(FORM_INICIAL);
    const [emailTocado, setEmailTocado] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(true);
    const [erroModal, setErroModal] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [clienteExcluir, setClienteExcluir] = useState(null);
    const [excluindo, setExcluindo] = useState(false);

    const buscarTodosClientes = useCallback(async () => {
        if (!ehFuncionario) return;
        setCarregando(true);
        setErro("");
        try {
            const response = await api.get("/cliente");
            setClientes(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
            setErro(error.response?.data?.erro || "Erro ao carregar a lista de clientes.");
        } finally {
            setCarregando(false);
        }
    }, [ehFuncionario]);

    useEffect(() => {
        if (ehFuncionario) {
            buscarTodosClientes();
        }
    }, [ehFuncionario, buscarTodosClientes]);

    const clientesFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return clientes;
        return clientes.filter((c) => {
            const id = String(c.usuario_id || "");
            const nome = String(c.usuario?.nome_completo || "").toLowerCase();
            const doc = String(c.cnpj_cpf || "").toLowerCase();
            const tel = String(c.telefone || "").toLowerCase();
            const email = String(c.usuario?.email || "").toLowerCase();
            return (
                id === termo ||
                nome.includes(termo) ||
                doc.includes(termo) ||
                tel.includes(termo) ||
                email.includes(termo)
            );
        });
    }, [clientes, busca]);

    function abrirNovoCliente() {
        setModoEdicao(false);
        setForm({
            ...FORM_INICIAL,
            senha: gerarSenhaSugerida(),
        });
        setEmailTocado(false);
        setMostrarSenha(true);
        setErroModal("");
        setModalAberto(true);
    }

    function abrirEdicao(item) {
        const emailAtual = item.usuario?.email || "";
        setModoEdicao(true);
        setForm({
            usuario_id: item.usuario_id,
            nome_completo: item.usuario?.nome_completo || "",
            cnpj_cpf: item.cnpj_cpf || "",
            telefone: item.telefone || "",
            email: emailAtual,
            endereco: item.endereco || "",
            senha: "",
        });
        setEmailTocado(Boolean(emailAtual.trim()) && !emailEhValido(emailAtual));
        setMostrarSenha(true);
        setErroModal("");
        setModalAberto(true);
    }

    async function salvarCliente(event) {
        event.preventDefault();
        setErroModal("");

        if (!emailEhValido(form.email)) {
            setEmailTocado(true);
            setErroModal(MENSAGEM_ERRO_EMAIL);
            return;
        }

        if (!modoEdicao && (!form.senha || form.senha.trim().length < 4)) {
            setErroModal("Defina uma senha de acesso para o cliente com pelo menos 4 caracteres.");
            return;
        }
        if (modoEdicao && form.senha.trim() && form.senha.trim().length < 4) {
            setErroModal("A nova senha deve ter pelo menos 4 caracteres.");
            return;
        }

        const payload = {
            nome_completo: form.nome_completo.trim(),
            cnpj_cpf: form.cnpj_cpf.trim(),
            telefone: form.telefone.trim(),
            email: normalizarEmail(form.email),
            endereco: form.endereco.trim(),
        };
        if (form.senha.trim()) {
            payload.senha = form.senha.trim();
        }

        setSalvando(true);
        try {
            if (modoEdicao) {
                await api.put(`/cliente/${form.usuario_id}`, payload);
                setSucessoMsg("Dados do cliente atualizados com sucesso!");
                if (payload.senha) {
                    setCredenciaisProntas({
                        nome: payload.nome_completo,
                        email: payload.email,
                        senha: payload.senha,
                        acao: "Senha redefinida",
                    });
                    setCopiado(false);
                }
            } else {
                await api.post("/cliente", payload);
                setSucessoMsg("Cliente cadastrado com sucesso!");
                setCredenciaisProntas({
                    nome: payload.nome_completo,
                    email: payload.email,
                    senha: payload.senha,
                    acao: "Acesso criado para o Portal do Cliente",
                });
                setCopiado(false);
            }

            setModalAberto(false);
            setForm(FORM_INICIAL);
            buscarTodosClientes();
        } catch (error) {
            console.error("Erro ao salvar cliente:", error);
            setErroModal(error.response?.data?.erro || "Erro ao salvar cliente.");
        } finally {
            setSalvando(false);
        }
    }

    async function confirmarExclusao() {
        if (!clienteExcluir) return;
        setExcluindo(true);
        try {
            const id = clienteExcluir.usuario_id;
            await api.delete(`/cliente/${id}`);
            setSucessoMsg("Cliente removido com sucesso.");
            setClienteExcluir(null);
            if (clienteSelecionado && clienteSelecionado.usuario_id === id) {
                setClienteSelecionado(null);
            }
            buscarTodosClientes();
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            setErro(
                error.response?.data?.erro ||
                    "Não foi possível excluir este cliente (pode possuir pedidos vinculados)."
            );
            setClienteExcluir(null);
        } finally {
            setExcluindo(false);
        }
    }

    async function copiarCredenciais() {
        if (!credenciaisProntas) return;
        const texto = `Acesso Portal APORTEC\nCliente: ${credenciaisProntas.nome}\nE-mail: ${credenciaisProntas.email}\nSenha: ${credenciaisProntas.senha}`;
        try {
            await navigator.clipboard?.writeText(texto);
            setCopiado(true);
        } catch {
            setCopiado(false);
        }
    }

    if (!ehFuncionario) {
        return (
            <Box sx={{ py: 4 }}>
                <Alert severity="info">Acesso restrito a colaboradores (ADM ou TECNICO).</Alert>
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
                        Clientes APORTEC
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Consulta e gerenciamento de clientes cadastrados e suas credenciais do portal
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={buscarTodosClientes}
                        disabled={carregando}
                    >
                        Atualizar
                    </Button>
                    {ehAdm && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovoCliente}>
                            Novo Cliente
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

            {clienteSelecionado ? (
                <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
                    <CardHeader
                        avatar={
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                <PersonIcon />
                            </Avatar>
                        }
                        title={
                            <Typography variant="h6" fontWeight="bold">
                                {clienteSelecionado.usuario?.nome_completo}
                            </Typography>
                        }
                        subheader={`ID do Cliente (Usuário Vinculado): #${clienteSelecionado.usuario_id}`}
                        action={
                            <Stack direction="row" spacing={1}>
                                {ehAdm && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        onClick={() => abrirEdicao(clienteSelecionado)}
                                    >
                                        Editar / Senha
                                    </Button>
                                )}
                                <Button
                                    startIcon={<ArrowBackIcon />}
                                    variant="outlined"
                                    onClick={() => setClienteSelecionado(null)}
                                >
                                    Voltar para Lista
                                </Button>
                            </Stack>
                        }
                    />
                    <Divider />
                    <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    CNPJ / CPF
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {clienteSelecionado.cnpj_cpf || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    E-mail de Acesso (Portal)
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {clienteSelecionado.usuario?.email || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Telefone
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {clienteSelecionado.telefone || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Endereço
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {clienteSelecionado.endereco || "-"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                        <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            alignItems={{ xs: "stretch", sm: "center" }}
                            justifyContent="space-between"
                        >
                            <TextField
                                size="small"
                                placeholder="Buscar por nome, CNPJ/CPF, e-mail, telefone ou ID..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                sx={{ minWidth: { xs: "100%", sm: 360 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                Exibindo {clientesFiltrados.length} de {clientes.length} cliente(s) • Clique nos
                                cabeçalhos para ordenar
                            </Typography>
                        </Stack>
                    </Card>

                    {carregando ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Tabela
                            dados={clientesFiltrados}
                            onSelecionar={(c) => setClienteSelecionado(c)}
                            onEditar={ehAdm ? abrirEdicao : undefined}
                            onExcluir={ehAdm ? setClienteExcluir : undefined}
                        />
                    )}
                </>
            )}

            <Dialog open={modalAberto} onClose={() => setModalAberto(false)} maxWidth="sm" fullWidth>
                <form onSubmit={salvarCliente}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BusinessIcon color="primary" />
                        {modoEdicao ? "Editar Cliente e Acesso" : "Cadastrar Novo Cliente"}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2.25} sx={{ pt: 0.5 }}>
                            {erroModal && <Alert severity="error">{erroModal}</Alert>}

                            <Box>
                                <Typography variant="overline" color="primary" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
                                    Dados Cadastrais
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Nome Completo / Razão Social"
                                        value={form.nome_completo}
                                        onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
                                    />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="CNPJ ou CPF"
                                                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                                                value={form.cnpj_cpf}
                                                onChange={(e) => setForm({ ...form, cnpj_cpf: e.target.value })}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                label="Telefone"
                                                placeholder="(00) 00000-0000"
                                                value={form.telefone}
                                                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                                            />
                                        </Grid>
                                    </Grid>
                                    <TextField
                                        required
                                        fullWidth
                                        multiline
                                        rows={2}
                                        label="Endereço Completo"
                                        value={form.endereco}
                                        onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                                    />
                                </Stack>
                            </Box>

                            <Divider />

                            <Box>
                                <Typography variant="overline" color="primary" fontWeight="bold" sx={{ display: "block", mb: 1 }}>
                                    Acesso ao Portal do Cliente
                                </Typography>
                                <Stack spacing={2}>
                                    <TextField
                                        required
                                        fullWidth
                                        type="text"
                                        label="E-mail de Login"
                                        placeholder="nome@empresa.com"
                                        autoComplete="email"
                                        inputProps={{ inputMode: "email" }}
                                        value={form.email}
                                        onChange={(e) => {
                                            const novoEmail = e.target.value;
                                            setForm({ ...form, email: novoEmail });
                                            if (erroModal === MENSAGEM_ERRO_EMAIL && emailEhValido(novoEmail)) {
                                                setErroModal("");
                                            }
                                        }}
                                        onBlur={() => setEmailTocado(true)}
                                        {...obterAjudaEmail(form.email, emailTocado)}
                                    />
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                                        <TextField
                                            required={!modoEdicao}
                                            fullWidth
                                            label={
                                                modoEdicao
                                                    ? "Nova Senha (deixe em branco para manter)"
                                                    : "Senha de Acesso ao Portal"
                                            }
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
                                        <Tooltip title="Gerar senha fácil para enviar ao cliente">
                                            <Button
                                                type="button"
                                                variant="outlined"
                                                startIcon={<AutoFixHighIcon />}
                                                onClick={() => {
                                                    setForm({ ...form, senha: gerarSenhaSugerida() });
                                                    setMostrarSenha(true);
                                                }}
                                                sx={{ whiteSpace: "nowrap" }}
                                            >
                                                Gerar Senha
                                            </Button>
                                        </Tooltip>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                        O cliente usará o e-mail e esta senha para acompanhar seus pedidos, aprovar
                                        orçamentos e abrir chamados de assistência.
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setModalAberto(false)} color="inherit" disabled={salvando}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="primary" disabled={salvando}>
                            {salvando ? <CircularProgress size={22} color="inherit" /> : "Salvar Cliente"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog
                open={Boolean(credenciaisProntas)}
                onClose={() => setCredenciaisProntas(null)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VpnKeyIcon color="success" />
                    Credenciais do Portal do Cliente
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Alert severity="success">{credenciaisProntas?.acao}</Alert>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Typography variant="caption" color="text.secondary">
                                Cliente
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {credenciaisProntas?.nome}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                E-mail de Acesso
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" gutterBottom>
                                {credenciaisProntas?.email}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Senha Definida
                            </Typography>
                            <Typography variant="body1" fontWeight="bold" color="primary.main">
                                {credenciaisProntas?.senha}
                            </Typography>
                        </Paper>
                        <Typography variant="caption" color="text.secondary">
                            Repasse estas credenciais ao cliente. Ele poderá alterar a senha a qualquer momento
                            clicando no próprio nome na barra superior.
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ContentCopyIcon />}
                        onClick={copiarCredenciais}
                    >
                        {copiado ? "Copiado!" : "Copiar Acesso"}
                    </Button>
                    <Button variant="contained" onClick={() => setCredenciaisProntas(null)}>
                        Concluir
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(clienteExcluir)} onClose={() => setClienteExcluir(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2">
                        Deseja realmente remover o cliente{" "}
                        <strong>{clienteExcluir?.usuario?.nome_completo}</strong> ({clienteExcluir?.cnpj_cpf})?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClienteExcluir(null)} color="inherit" disabled={excluindo}>
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
