import { useState } from "react";
import {
    Container,
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Alert,
    Avatar,
    Stack,
    IconButton,
    InputAdornment,
    CircularProgress,
    Divider,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LoginIcon from "@mui/icons-material/Login";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../services/api";

export default function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const [mensagem, setMensagem] = useState("");
    const [severidade, setSeveridade] = useState("info");
    const [carregando, setCarregando] = useState(false);

    async function enviaLogin(event) {
        event.preventDefault();
        setMensagem("");
        setCarregando(true);

        try {
            const response = await api.post("/auth/login", {
                email: email.trim(),
                senha,
            });

            const token = response.data.token;
            const usuario = response.data.usuario || { email: email.trim() };

            localStorage.setItem("token", token);
            localStorage.setItem("usuario", JSON.stringify(usuario));

            setMensagem("Login realizado com sucesso!");
            setSeveridade("success");

            onLogin?.(usuario);
        } catch (error) {
            console.error("Erro no login:", error);
            setMensagem(error.response?.data?.erro || "Falha ao autenticar no servidor.");
            setSeveridade("error");
        } finally {
            setCarregando(false);
        }
    }

    function limparFormulario() {
        setEmail("");
        setSenha("");
        setMensagem("");
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Card elevation={4} sx={{ borderRadius: 3, p: 1 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Avatar sx={{ m: 1, bgcolor: "primary.main", width: 56, height: 56 }}>
                        <LockOutlinedIcon fontSize="large" />
                    </Avatar>

                    <Typography component="h1" variant="h5" fontWeight="bold" gutterBottom>
                        APORTEC
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Sistema de Gestão Operacional &amp; Produtiva
                    </Typography>

                    {mensagem && (
                        <Alert severity={severidade} sx={{ width: "100%", mb: 2 }}>
                            {mensagem}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={enviaLogin} sx={{ width: "100%" }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="email-input"
                            label="E-mail"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="senha"
                            label="Senha"
                            type={mostrarSenha ? "text" : "password"}
                            id="senha-input"
                            autoComplete="current-password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlinedIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="alternar visibilidade da senha"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            edge="end"
                                        >
                                            {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }}>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                disabled={carregando}
                                startIcon={
                                    carregando ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />
                                }
                                sx={{ py: 1.2, fontWeight: "bold" }}
                            >
                                {carregando ? "Entrando..." : "Entrar"}
                            </Button>

                            <Button
                                type="button"
                                fullWidth
                                variant="outlined"
                                color="secondary"
                                onClick={limparFormulario}
                                disabled={carregando}
                                startIcon={<ClearAllIcon />}
                                sx={{ py: 1.2 }}
                            >
                                Limpar
                            </Button>
                        </Stack>
                    </Box>

                    <Divider sx={{ width: "100%", my: 1 }} />
                    <Typography variant="caption" color="text.secondary" align="center">
                        Acesso restrito a colaboradores e clientes cadastrados pela administração APORTEC
                    </Typography>
                </CardContent>
            </Card>
        </Container>
    );
}
