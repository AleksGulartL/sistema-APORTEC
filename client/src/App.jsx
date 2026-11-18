import { useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from "@mui/material";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Clientes from "./components/Clientes";
import Usuarios from "./components/Usuarios";
import Perfil from "./components/Perfil";
import { usuarioEhAdm } from "./utils/permissoes";

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

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return Boolean(localStorage.getItem("token"));
    });

    const [usuario, setUsuario] = useState(() => {
        const salvo = localStorage.getItem("usuario");
        return salvo ? JSON.parse(salvo) : null;
    });

    const [abaAtiva, setAbaAtiva] = useState("dashboard");

    // Event listener para expiração de token tratada pelo interceptor do Axios
    useEffect(() => {
        function onTokenExpired() {
            setIsLoggedIn(false);
            setUsuario(null);
            setAbaAtiva("dashboard");
        }
        window.addEventListener("auth:expired", onTokenExpired);
        return () => window.removeEventListener("auth:expired", onTokenExpired);
    }, []);

    function handleLogin(novoUsuario) {
        setIsLoggedIn(true);
        setAbaAtiva("dashboard");
        if (novoUsuario) {
            setUsuario(novoUsuario);
        } else {
            const salvo = localStorage.getItem("usuario");
            setUsuario(salvo ? JSON.parse(salvo) : null);
        }
    }

    function handleLogout() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setIsLoggedIn(false);
        setUsuario(null);
        setAbaAtiva("dashboard");
    }

    const ehAdm = usuarioEhAdm(usuario);
    const abaSegura = abaAtiva === "usuarios" && !ehAdm ? "dashboard" : abaAtiva;

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
                        onMudarAba={setAbaAtiva}
                        onLogout={handleLogout}
                    />

                    <Container maxWidth="lg" sx={{ mt: 2, pb: 6 }}>
                        {abaSegura === "dashboard" && <Dashboard usuario={usuario} />}
                        {abaSegura === "clientes" && <Clientes usuario={usuario} />}
                        {abaSegura === "usuarios" && ehAdm && <Usuarios usuario={usuario} />}
                        {abaSegura === "perfil" && <Perfil />}
                    </Container>
                </Box>
            )}
        </ThemeProvider>
    );
}
