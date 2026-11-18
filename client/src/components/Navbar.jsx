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
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import { obterPerfilUsuario, usuarioEhAdm } from "../utils/permissoes";

export default function Navbar({ usuario, abaAtiva, onMudarAba, onLogout }) {
    const nome = usuario?.nome_completo || usuario?.nome || usuario?.email || "Usuário";
    const cargo = obterPerfilUsuario(usuario) || usuario?.cargo_funcao || "Operador";
    const ehAdm = usuarioEhAdm(usuario);

    const abas = (
        <Tabs
            value={abaAtiva}
            onChange={(_, val) => onMudarAba(val)}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
                "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: "medium",
                    fontSize: "0.9rem",
                    minHeight: 48,
                },
            }}
        >
            <Tab value="dashboard" icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
            <Tab value="pedidos" icon={<AssignmentIcon />} iconPosition="start" label="Pedidos" />
            <Tab value="catalogo" icon={<Inventory2Icon />} iconPosition="start" label="Estoque" />
            <Tab value="ordens_servico" icon={<BuildIcon />} iconPosition="start" label="OS" />
            <Tab value="prontuario" icon={<QrCode2Icon />} iconPosition="start" label="Prontuário" />
            <Tab value="clientes" icon={<PeopleAltIcon />} iconPosition="start" label="Clientes" />
            {ehAdm && (
                <Tab value="usuarios" icon={<ManageAccountsIcon />} iconPosition="start" label="Usuários" />
            )}
            <Tab value="perfil" icon={<PersonIcon />} iconPosition="start" label="Perfil" />
        </Tabs>
    );

    return (
        <AppBar position="sticky" elevation={2} sx={{ bgcolor: "#0f3460" }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
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

                    <Box sx={{ display: { xs: "none", lg: "flex" }, flex: 1, minWidth: 0, justifyContent: "center" }}>
                        {abas}
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
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

                <Box sx={{ display: { xs: "flex", lg: "none" }, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    {abas}
                </Box>
            </Container>
        </AppBar>
    );
}
