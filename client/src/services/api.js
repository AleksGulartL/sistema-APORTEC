import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json;charset=utf-8",
    },
});

// Interceptor para injetar o token JWT automaticamente em todas as requisições
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor para tratar expiração do token (401) e falhas de conexão com a API
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            error.response = {
                status: 0,
                data: {
                    erro: "Não foi possível conectar ao servidor (API indisponível). Verifique sua conexão ou se o back-end está em execução.",
                },
            };
            return Promise.reject(error);
        }

        if (error.response.status === 401) {
            const url = error.config?.url || "";
            if (!url.includes("/auth/login")) {
                localStorage.removeItem("token");
                localStorage.removeItem("usuario");
                window.dispatchEvent(new Event("auth:expired"));
            }
        }
        return Promise.reject(error);
    }
);

export default api;
