import { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Divider,
    Grid,
    Chip,
    CircularProgress,
    Alert,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import api from "../services/api";

export default function Perfil() {
    const [perfil, setPerfil] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    useEffect(() => {
        async function carregarPerfil() {
            try {
                const response = await api.get("/auth/perfil");
                setPerfil(response.data);
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
                // Fallback para os dados armazenados em localStorage
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

    return (
        <Box sx={{ py: 3, maxWidth: 600, mx: "auto" }}>
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
                        label={`Perfil: ${perfil?.perfil || perfil?.cargo_funcao || perfil?.role || "Operador"}`}
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

                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                E-mail de Contato
                            </Typography>
                            <Typography variant="body1">{perfil?.email || "-"}</Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
