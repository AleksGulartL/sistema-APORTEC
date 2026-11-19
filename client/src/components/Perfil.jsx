import { useState, useEffect } from "react";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../services/api";
import { obterPerfilUsuario, usuarioEhCliente } from "../utils/permissoes";

export default function Perfil() {
    const [perfil, setPerfil] = useState(null);
    const [dadosCliente, setDadosCliente] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // Alteração da própria senha
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
    const [mostrarSenhas, setMostrarSenhas] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [msgSenha, setMsgSenha] = useState("");
    const [erroSenha, setErroSenha] = useState("");

    useEffect(() => {
        async function carregarPerfil() {
            try {
                const response = await api.get("/auth/perfil");
                const dados = response.data;
                setPerfil(dados);

                if (usuarioEhCliente(dados)) {
                    try {
                        const resCli = await api.get("/portal-cliente/resumo");
                        setDadosCliente(resCli.data?.cliente || null);
                    } catch {
                        // Cliente ainda pode não possuir ficha complementar vinculada
                    }
                }
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
                const usuarioLocal = localStorage.getItem("usuario");
                if (usuarioLocal) {
                    setPerfil(JSON.parse(usuarioLocal));
                } else {
                    setErro("Não foi possível carregar os dados do perfil.");
                }
            } finally {
                setCarregando(false);
            }
        }
        carregarPerfil();
    }, []);

    async function handleAlterarSenha(event) {
        event.preventDefault();
        setMsgSenha("");
        setErroSenha("");

        if (novaSenha.trim().length < 4) {
            setErroSenha("A nova senha deve ter pelo menos 4 caracteres.");
            return;
        }
        if (novaSenha !== confirmacaoSenha) {
            setErroSenha("A confirmação de senha não confere com a nova senha.");
            return;
        }

        setSalvandoSenha(true);
        try {
            const res = await api.patch("/auth/alterar-senha", {
                senha_atual: senhaAtual,
                nova_senha: novaSenha.trim(),
            });
            setMsgSenha(res.data?.mensagem || "Senha atualizada com sucesso!");
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmacaoSenha("");
        } catch (err) {
            console.error("Erro ao alterar senha:", err);
            setErroSenha(err.response?.data?.erro || "Não foi possível alterar a senha.");
        } finally {
            setSalvandoSenha(false);
        }
    }

    if (carregando) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (erro && !perfil) {
        return <Alert severity="error">{erro}</Alert>;
    }

    const tipoPerfil = obterPerfilUsuario(perfil) || "Usuário";

    return (
        <Box sx={{ py: 3, maxWidth: 680, mx: "auto" }}>
            <Stack spacing={3}>
                <Card elevation={3} sx={{ borderRadius: 3, textAlign: "center", p: 2 }}>
                    <CardContent>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: "primary.main",
                                mx: "auto",
                                mb: 2,
                            }}
                        >
                            <AccountCircleIcon sx={{ fontSize: 60 }} />
                        </Avatar>

                        <Typography variant="h5" fontWeight="bold">
                            {perfil?.nome_completo || perfil?.nome || "Usuário APORTEC"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {perfil?.email}
                        </Typography>

                        <Chip
                            icon={<AdminPanelSettingsIcon />}
                            label={`Perfil: ${tipoPerfil}`}
                            color="primary"
                            variant="outlined"
                            sx={{ mb: 3 }}
                        />

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2} sx={{ textAlign: "left" }}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                    ID do Usuário
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    #{perfil?.id_usuario || perfil?.id || "-"}
                                </Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">
                                    Situação da Conta
                                </Typography>
                                <Typography variant="body1" fontWeight="medium" color="success.main">
                                    ● Ativo
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">
                                    E-mail de Acesso
                                </Typography>
                                <Typography variant="body1">{perfil?.email || "-"}</Typography>
                            </Grid>



                            {dadosCliente && (
                                <>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            CNPJ / CPF
                                        </Typography>
                                        <Typography variant="body1">{dadosCliente.cnpj_cpf || "-"}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Telefone
                                        </Typography>
                                        <Typography variant="body1">{dadosCliente.telefone || "-"}</Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary">
                                            Endereço Cadastrado
                                        </Typography>
                                        <Typography variant="body1">{dadosCliente.endereco || "-"}</Typography>
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </CardContent>
                </Card>

                {/* Card Alterar Senha */}
                <Card elevation={2} sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                            <LockResetIcon color="primary" />
                            <Typography variant="h6" fontWeight="bold">
                                Alterar Minha Senha
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Caso tenha recebido uma senha provisória, defina aqui uma senha pessoal.
                        </Typography>

                        {msgSenha && (
                            <Alert severity="success" onClose={() => setMsgSenha("")} sx={{ mb: 2 }}>
                                {msgSenha}
                            </Alert>
                        )}
                        {erroSenha && (
                            <Alert severity="error" onClose={() => setErroSenha("")} sx={{ mb: 2 }}>
                                {erroSenha}
                            </Alert>
                        )}

                        <form onSubmit={handleAlterarSenha}>
                            <Stack spacing={2}>
                                <TextField
                                    required
                                    fullWidth
                                    size="small"
                                    label="Senha Atual"
                                    type={mostrarSenhas ? "text" : "password"}
                                    value={senhaAtual}
                                    onChange={(e) => setSenhaAtual(e.target.value)}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setMostrarSenhas(!mostrarSenhas)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {mostrarSenhas ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            size="small"
                                            label="Nova Senha"
                                            type={mostrarSenhas ? "text" : "password"}
                                            value={novaSenha}
                                            onChange={(e) => setNovaSenha(e.target.value)}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            size="small"
                                            label="Confirmar Nova Senha"
                                            type={mostrarSenhas ? "text" : "password"}
                                            value={confirmacaoSenha}
                                            onChange={(e) => setConfirmacaoSenha(e.target.value)}
                                        />
                                    </Grid>
                                </Grid>
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Button type="submit" variant="contained" disabled={salvandoSenha}>
                                        {salvandoSenha ? <CircularProgress size={20} color="inherit" /> : "Atualizar Senha"}
                                    </Button>
                                </Box>
                            </Stack>
                        </form>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}
