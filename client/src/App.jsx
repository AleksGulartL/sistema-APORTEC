import { useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline, Container, Box } from "@mui/material";
import Login from "./components/Login";
import Navbar from "./components/Navbar";
import Clientes from "./components/Clientes";
import Perfil from "./components/Perfil";

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

    const [tabIndex, setTabIndex] = useState(0); // 0: Clientes, 1: Perfil

    // Event listener para expiração de token tratada pelo interceptor do Axios
    useEffect(() => {
        function onTokenExpired() {
            setIsLoggedIn(false);
            setUsuario(null);
        }
        window.addEventListener("auth:expired", onTokenExpired);
        return () => window.removeEventListener("auth:expired", onTokenExpired);
    }, []);

    function handleLogin(novoUsuario) {
        setIsLoggedIn(true);
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
                        tabIndex={tabIndex}
                        onTabChange={setTabIndex}
                        onLogout={handleLogout}
                    />

                    <Container maxWidth="lg" sx={{ mt: 2, pb: 6 }}>
                        {tabIndex === 0 && <Clientes />}
                        {tabIndex === 1 && <Perfil />}
                    </Container>
                </Box>
            )}
        </ThemeProvider>
    );
}
