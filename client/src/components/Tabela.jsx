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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function Tabela({ dados = [], onSelecionar }) {
    if (!dados || dados.length === 0) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                    Nenhum registro encontrado.
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Table sx={{ minWidth: 650 }} aria-label="tabela de dados">
                <TableHead sx={{ bgcolor: "primary.main" }}>
                    <TableRow>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nome / Razão Social</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>CNPJ / CPF</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Telefone</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>E-mail</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Endereço</TableCell>
                        {onSelecionar && (
                            <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                                Ações
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dados.map((item, index) => {
                        const id = item.id_cliente || item.id || item.id_usuario || index + 1;
                        const nome = item.nome_completo || item.nome || "-";
                        const doc = item.cnpj_cpf || "-";
                        const tel = item.telefone || "-";
                        const email = item.email || "-";
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
                                {onSelecionar && (
                                    <TableCell align="center">
                                        <Tooltip title="Ver Detalhes">
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => onSelecionar(item)}
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
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
