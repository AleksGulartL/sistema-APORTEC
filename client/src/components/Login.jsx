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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import api from "../services/api";

export default function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [passwd, setPasswd] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [messageText, setMessageText] = useState("");
    const [messageSeverity, setMessageSeverity] = useState("info");
    const [loading, setLoading] = useState(false);

    async function enviaLogin(event) {
        event.preventDefault();
        setMessageText("");
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email: username,
                username: username,
                senha: passwd,
                password: passwd,
            });

            if (response.status >= 200 && response.status < 300) {
                const token = response.data.token;
                const usuario = response.data.usuario || { email: username };

                localStorage.setItem("token", token);
                localStorage.setItem("usuario", JSON.stringify(usuario));

                setMessageText("Login realizado com sucesso!");
                setMessageSeverity("success");

                if (onLogin) {
                    onLogin(usuario);
                }
            } else {
                setMessageText("Falha na autenticação!");
                setMessageSeverity("error");
            }
        } catch (error) {
            console.error("Erro no login:", error);
            const msg =
                error.response?.data?.erro ||
                error.response?.data?.message ||
                "Falha ao conectar com o servidor!";
            setMessageText(msg);
            setMessageSeverity("error");
        } finally {
            setLoading(false);
        }
    }

    function limparFormulario() {
        setUsername("");
        setPasswd("");
        setMessageText("Formulário limpo!");
        setMessageSeverity("warning");
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

                    {messageText && (
                        <Alert severity={messageSeverity} sx={{ width: "100%", mb: 2 }}>
                            {messageText}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={enviaLogin} sx={{ width: "100%" }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username-input"
                            label="E-mail"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            name="passwd"
                            label="Senha"
                            type={showPassword ? "text" : "password"}
                            id="passwd-input"
                            autoComplete="current-password"
                            value={passwd}
                            onChange={(e) => setPasswd(e.target.value)}
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
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
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
                                disabled={loading}
                                sx={{ py: 1.2, fontWeight: "bold" }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Entrar"}
                            </Button>
                            <Button
                                type="button"
                                fullWidth
                                variant="outlined"
                                color="secondary"
                                onClick={limparFormulario}
                                disabled={loading}
                            >
                                Limpar
                            </Button>
                        </Stack>
                    </Box>

                    <Divider sx={{ width: "100%", my: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" align="center">
                        Acesso restrito a usuários cadastrados. Novos acessos são criados pelo administrador.
                    </Typography>
                </CardContent>
            </Card>
        </Container>
    );
}
