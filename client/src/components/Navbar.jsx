import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Chip,
    Tabs,
    Tab,
    Container,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import PersonIcon from "@mui/icons-material/Person";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

export default function Navbar({ usuario, tabIndex, onTabChange, onLogout }) {
    const nome = usuario?.nome_completo || usuario?.nome || usuario?.email || "Usuário";
    const cargo = usuario?.cargo_funcao || usuario?.role || "Operador";

    return (
        <AppBar position="sticky" elevation={2} sx={{ bgcolor: "#0f3460" }}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between" }}>
                    {/* Logo e Nome da Aplicação */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <PrecisionManufacturingIcon sx={{ fontSize: 32, color: "#ff9800" }} />
                        <Typography
                            variant="h6"
                            noWrap
                            sx={{
                                fontWeight: 700,
                                letterSpacing: ".1rem",
                                color: "inherit",
                                textDecoration: "none",
                            }}
                        >
                            APORTEC
                        </Typography>
                    </Box>

                    {/* Abas de Navegação */}
                    <Tabs
                        value={tabIndex}
                        onChange={(e, val) => onTabChange(val)}
                        textColor="inherit"
                        indicatorColor="secondary"
                        sx={{
                            display: { xs: "none", sm: "flex" },
                            "& .MuiTab-root": { textTransform: "none", fontWeight: "medium", fontSize: "1rem" },
                        }}
                    >
                        <Tab icon={<PeopleAltIcon />} iconPosition="start" label="Clientes" />
                        <Tab icon={<PersonIcon />} iconPosition="start" label="Meu Perfil" />
                    </Tabs>

                    {/* Informações do Usuário e Botão de Logout */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Chip
                            avatar={<PersonIcon sx={{ color: "white !important" }} />}
                            label={`${nome} (${cargo})`}
                            sx={{
                                bgcolor: "rgba(255, 255, 255, 0.15)",
                                color: "white",
                                display: { xs: "none", md: "flex" },
                            }}
                        />

                        <Button
                            color="inherit"
                            variant="outlined"
                            size="small"
                            startIcon={<LogoutIcon />}
                            onClick={onLogout}
                            sx={{
                                borderColor: "rgba(255, 255, 255, 0.5)",
                                textTransform: "none",
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
                            }}
                        >
                            Sair
                        </Button>
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
