const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const usuarioRoutes = require("./src/modulos/usuario/usuario.routes");
const clienteRoutes = require("./src/modulos/cliente/cliente.routes");
const itemCatalogoRoutes = require("./src/modulos/itemCatalogo/itemCatalogo.routes");
const obrasServicosRoutes = require("./src/modulos/obrasServicos/obrasServicos.routes");
const orcamentoRoutes = require("./src/modulos/orcamento/orcamento.routes");
const itemOrcamentoRoutes = require("./src/modulos/itemOrcamento/itemOrcamento.routes");
const pedidoRoutes = require("./src/modulos/pedido/pedido.routes");
const checklistMedicaoRoutes = require("./src/modulos/checklist_medicao/checklist_medicao.routes");
const ordemProducaoRoutes = require("./src/modulos/ordemProducao/ordemProducao.routes");
const insumoOrdemProducaoRoutes = require("./src/modulos/insumoOrdemProducao/insumoOrdemProducao.routes");
const portaProdutoRoutes = require("./src/modulos/portaProduto/portaProduto.routes");
const ordemServicoRoutes = require("./src/modulos/ordemServico/ordemServico.routes");
const pecaUtilizadaRoutes = require("./src/modulos/pecaUtilizada/pecaUtilizada.routes");
const movimentacaoEstoqueRoutes = require("./src/modulos/movimentacaoEstoque/movimentacaoEstoque.routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rotas dos módulos do Sistema APORTEC
app.use(usuarioRoutes);
app.use(clienteRoutes);
app.use(itemCatalogoRoutes);
app.use(obrasServicosRoutes);
app.use(orcamentoRoutes);
app.use(itemOrcamentoRoutes);
app.use(pedidoRoutes);
app.use(checklistMedicaoRoutes);
app.use(ordemProducaoRoutes);
app.use(insumoOrdemProducaoRoutes);
app.use(portaProdutoRoutes);
app.use(ordemServicoRoutes);
app.use(pecaUtilizadaRoutes);
app.use(movimentacaoEstoqueRoutes);

app.listen(PORT, () => {
    console.log(`Servidor APORTEC rodando em http://localhost:${PORT}`);
});