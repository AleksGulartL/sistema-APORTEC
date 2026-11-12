import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    Grid,
    Divider,
    Alert,
    CircularProgress,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessIcon from "@mui/icons-material/Business";
import Tabela from "./Tabela";
import api from "../services/api";

export default function Clientes() {
    const [cliente, setCliente] = useState(null);
    const [clientes, setClientes] = useState([]);
    const [idCliente, setIdCliente] = useState("");
    const [exibeErro, setExibeErro] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    // Estado do Modal de Criação de Cliente
    const [openDialog, setOpenDialog] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoCnpjCpf, setNovoCnpjCpf] = useState("");
    const [novoTelefone, setNovoTelefone] = useState("");
    const [novoEmail, setNovoEmail] = useState("");
    const [novoEndereco, setNovoEndereco] = useState("");
    const [sucessoMsg, setSucessoMsg] = useState("");

    async function buscarTodosClientes() {
        setCarregando(true);
        setExibeErro(false);
        try {
            const response = await api.get("/cliente");
            // A API do APORTEC retorna diretamente um array de clientes
            const lista = Array.isArray(response.data) ? response.data : response.data.clientes || [];
            setClientes(lista);
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
            setExibeErro(true);
            setMensagemErro(error.response?.data?.erro || "Erro ao carregar a lista de clientes.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        buscarTodosClientes();
    }, []);

    async function buscarCliente() {
        if (!idCliente || !idCliente.trim()) {
            setExibeErro(true);
            setMensagemErro("Informe o ID do cliente para realizar a busca.");
            return;
        }

        setCarregando(true);
        setExibeErro(false);
        try {
            const response = await api.get(`/cliente/${idCliente.trim()}`);
            const dadosCliente = response.data.cliente || response.data;
            if (dadosCliente) {
                setCliente(dadosCliente);
            } else {
                setExibeErro(true);
                setMensagemErro("Cliente não encontrado.");
            }
        } catch (error) {
            console.error("Erro ao buscar cliente:", error);
            setExibeErro(true);
            setMensagemErro(error.response?.data?.erro || "Cliente não encontrado.");
        } finally {
            setCarregando(false);
        }
    }

    function limparDados() {
        setCliente(null);
        setIdCliente("");
        setExibeErro(false);
        setMensagemErro("");
        setSucessoMsg("");
    }

    async function criarCliente(event) {
        event.preventDefault();
        try {
            await api.post("/cliente", {
                nome_completo: novoNome,
                cnpj_cpf: novoCnpjCpf,
                telefone: novoTelefone,
                email: novoEmail,
                endereco: novoEndereco,
            });

            setSucessoMsg("Cliente cadastrado com sucesso!");
            setOpenDialog(false);
            // Limpa campos do modal
            setNovoNome("");
            setNovoCnpjCpf("");
            setNovoTelefone("");
            setNovoEmail("");
            setNovoEndereco("");
            // Atualiza a lista
            buscarTodosClientes();
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            alert(error.response?.data?.erro || "Erro ao cadastrar cliente.");
        }
    }

    return (
        <Box sx={{ py: 3 }}>
            {/* Cabeçalho da página */}
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
                        Consulta e gerenciamento de clientes cadastrados
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
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                    >
                        Novo Cliente
                    </Button>
                </Stack>
            </Stack>

            {sucessoMsg && (
                <Alert severity="success" onClose={() => setSucessoMsg("")} sx={{ mb: 2 }}>
                    {sucessoMsg}
                </Alert>
            )}

            {/* Visualização de um cliente individual (busca por ID) */}
            {cliente && !exibeErro && (
                <Card elevation={3} sx={{ borderRadius: 2, mb: 3 }}>
                    <CardHeader
                        avatar={
                            <Avatar sx={{ bgcolor: "primary.main" }}>
                                <PersonIcon />
                            </Avatar>
                        }
                        title={
                            <Typography variant="h6" fontWeight="bold">
                                {cliente.usuario?.nome_completo || cliente.nome_completo || cliente.nome}
                            </Typography>
                        }
                        subheader={`ID do Cliente: ${cliente.id_cliente || cliente.id} | Usuário Vinculado: #${cliente.usuario_id || cliente.usuario?.id || "-"}`}
                        action={
                            <Button
                                startIcon={<ArrowBackIcon />}
                                variant="outlined"
                                onClick={limparDados}
                            >
                                Voltar para Lista
                            </Button>
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
                                    {cliente.cnpj_cpf || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    E-mail (via Usuário)
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {cliente.usuario?.email || cliente.email || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Telefone
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {cliente.telefone || "-"}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Endereço
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {cliente.endereco || "-"}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Barra de Busca por ID */}
            {!cliente && (
                <Card elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Buscar por ID do cliente..."
                            value={idCliente}
                            onChange={(e) => setIdCliente(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") buscarCliente();
                            }}
                            sx={{ minWidth: { xs: "100%", sm: 260 } }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={buscarCliente}
                            disabled={carregando}
                        >
                            Buscar
                        </Button>
                        {(idCliente || exibeErro) && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<ClearIcon />}
                                onClick={limparDados}
                            >
                                Limpar
                            </Button>
                        )}
                    </Stack>

                    {exibeErro && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {mensagemErro || "Erro ao buscar cliente."}
                        </Alert>
                    )}
                </Card>
            )}

            {/* Listagem Geral via Tabela Material UI */}
            {!cliente && (
                <>
                    {carregando ? (
                        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Tabela dados={clientes} onSelecionar={(c) => setCliente(c)} />
                    )}
                </>
            )}

            {/* Modal de Cadastro de Novo Cliente */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <form onSubmit={criarCliente}>
                    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <BusinessIcon color="primary" />
                        Cadastrar Novo Cliente
                    </DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField
                                required
                                fullWidth
                                label="Nome Completo / Razão Social"
                                value={novoNome}
                                onChange={(e) => setNovoNome(e.target.value)}
                            />
                            <TextField
                                required
                                fullWidth
                                label="CNPJ ou CPF"
                                placeholder="00.000.000/0001-00 ou 000.000.000-00"
                                value={novoCnpjCpf}
                                onChange={(e) => setNovoCnpjCpf(e.target.value)}
                            />
                            <TextField
                                required
                                fullWidth
                                label="Telefone"
                                placeholder="(00) 00000-0000"
                                value={novoTelefone}
                                onChange={(e) => setNovoTelefone(e.target.value)}
                            />
                            <TextField
                                required
                                fullWidth
                                type="email"
                                label="E-mail"
                                value={novoEmail}
                                onChange={(e) => setNovoEmail(e.target.value)}
                            />
                            <TextField
                                required
                                fullWidth
                                multiline
                                rows={2}
                                label="Endereço Completo"
                                value={novoEndereco}
                                onChange={(e) => setNovoEndereco(e.target.value)}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ p: 2 }}>
                        <Button onClick={() => setOpenDialog(false)} color="inherit">
                            Cancelar
                        </Button>
                        <Button type="submit" variant="contained" color="primary">
                            Salvar Cliente
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
}
