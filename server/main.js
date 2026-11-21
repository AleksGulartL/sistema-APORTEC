const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./src/modulos/auth/auth.routes");
const usuarioRoutes = require("./src/modulos/usuario/usuario.routes");
const clienteRoutes = require("./src/modulos/cliente/cliente.routes");
const itemCatalogoRoutes = require("./src/modulos/itemCatalogo/itemCatalogo.routes");
const pedidoRoutes = require("./src/modulos/pedido/pedido.routes");
const pedidoItemRoutes = require("./src/modulos/pedidoItem/pedidoItem.routes");
const checklistMedicaoRoutes = require("./src/modulos/checklist_medicao/checklist_medicao.routes");
const ordemServicoRoutes = require("./src/modulos/ordemServico/ordemServico.routes");
const portalClienteRoutes = require("./src/modulos/portalCliente/portalCliente.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(usuarioRoutes);
app.use(clienteRoutes);
app.use(itemCatalogoRoutes);
app.use(pedidoRoutes);
app.use(pedidoItemRoutes);
app.use(checklistMedicaoRoutes);
app.use(ordemServicoRoutes);
app.use(portalClienteRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor APORTEC rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
