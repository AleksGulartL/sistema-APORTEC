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
    Tooltip,
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
import HomeIcon from "@mui/icons-material/Home";
import SensorDoorIcon from "@mui/icons-material/SensorDoor";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { obterPerfilUsuario, usuarioEhAdm, usuarioEhCliente } from "../utils/permissoes";

export default function Navbar({ usuario, abaAtiva, onMudarAba, onLogout }) {
    const nome = usuario?.nome_completo || usuario?.email || "Usuário";
    const primeiroNome = String(nome).split(" ")[0];
    const cargo = obterPerfilUsuario(usuario) || "Operador";
    const ehAdm = usuarioEhAdm(usuario);
    const ehCliente = usuarioEhCliente(usuario);

    const itensMenu = ehCliente
        ? [
              { valor: "cliente_inicio", label: "Início", icone: <HomeIcon /> },
              { valor: "cliente_pedidos", label: "Meus Pedidos", icone: <AssignmentIcon /> },
              { valor: "cliente_portas", label: "Minhas Portas", icone: <SensorDoorIcon /> },
              { valor: "cliente_os", label: "Assistência", icone: <SupportAgentIcon /> },
          ]
        : [
              { valor: "dashboard", label: "Dashboard", icone: <DashboardIcon /> },
              { valor: "pedidos", label: "Pedidos", icone: <AssignmentIcon /> },
              { valor: "catalogo", label: "Estoque", icone: <Inventory2Icon /> },
              { valor: "ordens_servico", label: "OS", icone: <BuildIcon /> },
              { valor: "prontuario", label: "Prontuário", icone: <QrCode2Icon /> },
              { valor: "clientes", label: "Clientes", icone: <PeopleAltIcon /> },
              ...(ehAdm ? [{ valor: "usuarios", label: "Usuários", icone: <ManageAccountsIcon /> }] : []),
          ];

    const tabValue = itensMenu.some((item) => item.valor === abaAtiva) ? abaAtiva : false;

    const abas = (
        <Tabs
            value={tabValue}
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
            {itensMenu.map((item) => (
                <Tab
                    key={item.valor}
                    value={item.valor}
                    icon={item.icone}
                    iconPosition="start"
                    label={item.label}
                />
            ))}
        </Tabs>
    );

    const perfilAtivo = abaAtiva === "perfil";

    return (
        <AppBar position="sticky" elevation={2} sx={{ bgcolor: "#0f3460" }}>
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box
                        onClick={() => onMudarAba(ehCliente ? "cliente_inicio" : "dashboard")}
                        sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0, cursor: "pointer" }}
                    >
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

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
                        <Tooltip title="Abrir Meu Perfil e Alterar Senha">
                            <Chip
                                clickable
                                onClick={() => onMudarAba("perfil")}
                                avatar={<PersonIcon sx={{ color: "white !important" }} />}
                                label={
                                    <>
                                        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                                            {nome} ({cargo})
                                        </Box>
                                        <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                                            {primeiroNome}
                                        </Box>
                                    </>
                                }
                                sx={{
                                    bgcolor: perfilAtivo ? "secondary.main" : "rgba(255, 255, 255, 0.16)",
                                    color: "white",
                                    fontWeight: perfilAtivo ? "bold" : "medium",
                                    border: perfilAtivo ? "1px solid #fff" : "1px solid rgba(255,255,255,0.25)",
                                    "&:hover": {
                                        bgcolor: perfilAtivo ? "secondary.dark" : "rgba(255, 255, 255, 0.28)",
                                    },
                                }}
                            />
                        </Tooltip>

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
