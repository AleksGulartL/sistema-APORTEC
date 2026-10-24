const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const autoresRoutes = require("./src/autores/autores.routes");
const livrosRoutes = require("./src/livros/livros.routes");
const leitoresRoutes = require("./src/leitores/leitores.routes");
const emprestimosRoutes = require("./src/emprestimos/emprestimos.routes");
const itemCatalogoRoutes = require("./src/modulos/itemCatalogo/itemCatalogo.routes");
const clientesRoutes = require("./src/modulos/clientes/clientes.routes");
const obrasServicosRoutes = require("./src/modulos/obrasServicos/obrasServicos.routes");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.use(autoresRoutes);
app.use(livrosRoutes);
app.use(leitoresRoutes);
app.use(emprestimosRoutes);
app.use(itemCatalogoRoutes);
app.use(clientesRoutes);
app.use(obrasServicosRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});