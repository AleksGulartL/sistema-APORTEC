import { useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Stack,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CabecalhoOrdenavel from "./comum/CabecalhoOrdenavel";
import { ordenarLista } from "../utils/permissoes";

const EXTRATORES_CLIENTE = {
    usuario_id: (item) => Number(item.usuario_id || 0),
    nome: (item) => item.usuario?.nome_completo || "",
    cnpj_cpf: (item) => item.cnpj_cpf || "",
    telefone: (item) => item.telefone || "",
    email: (item) => item.usuario?.email || "",
    endereco: (item) => item.endereco || "",
};

export default function Tabela({ dados = [], onSelecionar, onEditar, onExcluir }) {
    const [ordenacao, setOrdenacao] = useState({ campo: "usuario_id", direcao: "asc" });

    const dadosOrdenados = useMemo(
        () => ordenarLista(dados, ordenacao.campo, ordenacao.direcao, EXTRATORES_CLIENTE),
        [dados, ordenacao]
    );

    if (!dados || dados.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    Nenhum registro encontrado.
                </Typography>
            </Box>
        );
    }

    const temAcoes = Boolean(onSelecionar || onEditar || onExcluir);

    return (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de clientes">
                <TableHead sx={{ bgcolor: "primary.main" }}>
                    <TableRow>
                        <CabecalhoOrdenavel
                            campo="usuario_id"
                            rotulo="ID"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        <CabecalhoOrdenavel
                            campo="nome"
                            rotulo="Nome / Razão Social"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        <CabecalhoOrdenavel
                            campo="cnpj_cpf"
                            rotulo="CNPJ / CPF"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        <CabecalhoOrdenavel
                            campo="telefone"
                            rotulo="Telefone"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        <CabecalhoOrdenavel
                            campo="email"
                            rotulo="E-mail"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        <CabecalhoOrdenavel
                            campo="endereco"
                            rotulo="Endereço"
                            ordenacao={ordenacao}
                            onOrdenar={setOrdenacao}
                        />
                        {temAcoes && (
                            <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                Ações
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dadosOrdenados.map((item) => {
                        const id = item.usuario_id;
                        const nome = item.usuario?.nome_completo || "-";
                        const doc = item.cnpj_cpf || "-";
                        const tel = item.telefone || "-";
                        const email = item.usuario?.email || "-";
                        const end = item.endereco || "-";

                        return (
                            <TableRow
                                key={id}
                                hover
                                sx={{
                                    "&:nth-of-type(odd)": { bgcolor: "action.hover" },
                                    "&:last-child td, &:last-child th": { border: 0 },
                                }}
                            >
                                <TableCell component="th" scope="row" sx={{ fontWeight: "medium" }}>
                                    {id}
                                </TableCell>
                                <TableCell sx={{ fontWeight: "medium" }}>{nome}</TableCell>
                                <TableCell>{doc}</TableCell>
                                <TableCell>{tel}</TableCell>
                                <TableCell>{email}</TableCell>
                                <TableCell>{end}</TableCell>
                                {temAcoes && (
                                    <TableCell align="center">
                                        <Stack direction="row" spacing={0.5} justifyContent="center">
                                            {onSelecionar && (
                                                <Tooltip title="Ver Detalhes">
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => onSelecionar(item)}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {onEditar && (
                                                <Tooltip title="Editar / Redefinir Senha">
                                                    <IconButton
                                                        color="secondary"
                                                        size="small"
                                                        onClick={() => onEditar(item)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {onExcluir && (
                                                <Tooltip title="Excluir Cliente">
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => onExcluir(item)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </TableCell>
                                )}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
