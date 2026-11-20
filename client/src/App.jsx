import { useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from "@mui/material";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import CatalogoEstoque from "./components/CatalogoEstoque";
import Pedidos from "./components/Pedidos";
import OrdensServico from "./components/OrdensServico";
import ProntuarioPorta from "./components/ProntuarioPorta";
import Clientes from "./components/Clientes";
import Usuarios from "./components/Usuarios";
import PortalCliente from "./components/PortalCliente";
import Perfil from "./components/Perfil";
import { usuarioEhAdm, usuarioEhCliente } from "./utils/permissoes";

// Tema Material UI customizado para o APORTEC
const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#0f3460",
            light: "#1a4b8c",
            dark: "#081d36",
        },
        secondary: {
            main: "#ff9800",
        },
        background: {
            default: "#f4f6f8",
            paper: "#ffffff",
        },
    },
    typography: {
        fontFamily: [
            "Roboto",
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Arial",
            "sans-serif",
        ].join(","),
        button: {
            textTransform: "none",
        },
    },
    shape: {
        borderRadius: 8,
    },
});

const ABAS_CLIENTE = ["cliente_inicio", "cliente_pedidos", "cliente_portas", "cliente_os", "perfil"];

function abaInicialPara(usuario) {
    return usuarioEhCliente(usuario) ? "cliente_inicio" : "dashboard";
}

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return Boolean(localStorage.getItem("token"));
    });

    const [usuario, setUsuario] = useState(() => {
        const salvo = localStorage.getItem("usuario");
        return salvo ? JSON.parse(salvo) : null;
    });

    const [abaAtiva, setAbaAtiva] = useState(() => {
        const salvo = localStorage.getItem("usuario");
        const parsed = salvo ? JSON.parse(salvo) : null;
        return abaInicialPara(parsed);
    });
    const [pedidoContextoId, setPedidoContextoId] = useState(null);
    const [prontuarioBuscaInicial, setProntuarioBuscaInicial] = useState("");
    const [pedidoParaNovaOs, setPedidoParaNovaOs] = useState(null);
    const [pedidoConsultaOsId, setPedidoConsultaOsId] = useState(null);

    // Event listener para expiração de token tratada pelo interceptor do Axios
    useEffect(() => {
        function onTokenExpired() {
            setIsLoggedIn(false);
            setUsuario(null);
            setAbaAtiva("dashboard");
            setPedidoContextoId(null);
            setProntuarioBuscaInicial("");
            setPedidoParaNovaOs(null);
            setPedidoConsultaOsId(null);
        }
        window.addEventListener("auth:expired", onTokenExpired);
        return () => window.removeEventListener("auth:expired", onTokenExpired);
    }, []);

    function handleLogin(novoUsuario) {
        let userFinal = novoUsuario;
        if (!userFinal) {
            const salvo = localStorage.getItem("usuario");
            userFinal = salvo ? JSON.parse(salvo) : null;
        }
        setIsLoggedIn(true);
        setUsuario(userFinal);
        setAbaAtiva(abaInicialPara(userFinal));
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setIsLoggedIn(false);
        setUsuario(null);
        setAbaAtiva("dashboard");
        setPedidoContextoId(null);
        setProntuarioBuscaInicial("");
        setPedidoParaNovaOs(null);
        setPedidoConsultaOsId(null);
    }

    function abrirPedido(idPedido) {
        setPedidoContextoId(idPedido);
        setAbaAtiva("pedidos");
    }

    function abrirProntuario(numeroSerie) {
        setProntuarioBuscaInicial(numeroSerie || "");
        setAbaAtiva("prontuario");
    }

    function consultarOsDoPedido(id) {
        setPedidoParaNovaOs(null);
        setPedidoConsultaOsId(id);
        setAbaAtiva("ordens_servico");
    }

    function abrirNovaOsParaPedido(pedido) {
        setPedidoConsultaOsId(null);
        setPedidoParaNovaOs(pedido);
        setAbaAtiva("ordens_servico");
    }

    const ehAdm = usuarioEhAdm(usuario);
    const ehCliente = usuarioEhCliente(usuario);

    let abaSegura = abaAtiva;
    if (ehCliente) {
        if (!ABAS_CLIENTE.includes(abaSegura)) {
            abaSegura = "cliente_inicio";
        }
    } else {
        if (abaSegura.startsWith("cliente_")) {
            abaSegura = "dashboard";
        }
        if (abaSegura === "usuarios" && !ehAdm) {
            abaSegura = "dashboard";
        }
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {!isLoggedIn ? (
                <Login onLogin={handleLogin} />
            ) : (
                <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                    <Navbar
                        usuario={usuario}
                        abaAtiva={abaSegura}
                        onMudarAba={(novaAba) => {
                            if (novaAba !== "ordens_servico") setPedidoConsultaOsId(null);
                            if (novaAba !== "pedidos") setPedidoContextoId(null);
                            if (novaAba !== "prontuario") setProntuarioBuscaInicial("");
                            setAbaAtiva(novaAba);
                        }}
                        onLogout={handleLogout}
                    />

                    <Container maxWidth="xl" sx={{ mt: 2, pb: 6 }}>
                        {ehCliente ? (
                            <>
                                {abaSegura !== "perfil" ? (
                                    <PortalCliente
                                        usuario={usuario}
                                        secao={abaSegura}
                                        onMudarSecao={setAbaAtiva}
                                    />
                                ) : (
                                    <Perfil />
                                )}
                            </>
                        ) : (
                            <>
                                {abaSegura === "dashboard" && (
                                    <Dashboard usuario={usuario} onAbrirPedido={abrirPedido} />
                                )}
                                {abaSegura === "pedidos" && (
                                    <Pedidos
                                        usuario={usuario}
                                        pedidoInicialId={pedidoContextoId}
                                        onLimparContexto={() => setPedidoContextoId(null)}
                                        onAbrirProntuario={abrirProntuario}
                                        onAbrirOs={abrirNovaOsParaPedido}
                                        onConsultarOs={consultarOsDoPedido}
                                    />
                                )}
                                {abaSegura === "catalogo" && <CatalogoEstoque usuario={usuario} />}
                                {abaSegura === "ordens_servico" && (
                                    <OrdensServico
                                        usuario={usuario}
                                        pedidoParaNovaOs={pedidoParaNovaOs}
                                        pedidoConsultaId={pedidoConsultaOsId}
                                        onLimparConsulta={() => setPedidoConsultaOsId(null)}
                                        onLimparContexto={() => setPedidoParaNovaOs(null)}
                                    />
                                )}
                                {abaSegura === "prontuario" && (
                                    <ProntuarioPorta
                                        usuario={usuario}
                                        buscaInicial={prontuarioBuscaInicial}
                                        onLimparContexto={() => setProntuarioBuscaInicial("")}
                                        onAbrirPedido={abrirPedido}
                                        onAbrirOs={abrirNovaOsParaPedido}
                                    />
                                )}
                                {abaSegura === "clientes" && <Clientes usuario={usuario} />}
                                {abaSegura === "usuarios" && ehAdm && <Usuarios usuario={usuario} />}
                                {abaSegura === "perfil" && <Perfil />}
                            </>
                        )}
                    </Container>
                </Box>
            )}
        </ThemeProvider>
    );
}
