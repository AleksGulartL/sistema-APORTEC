const service = require('../pedido.service');
const repo = require('../pedido.repository');
const { validarTecnico } = require('../../../utils/validarTecnico');
const portal = require('../../portalCliente/portalCliente.service');
const portalRepo = require('../../portalCliente/portalCliente.repository');
jest.mock('../pedido.repository');
jest.mock('../../../utils/validarTecnico');
jest.mock('../../portalCliente/portalCliente.repository');
const manutencao = { id: 9, tipo_pedido: 'Manutencao Corretiva', status: 'Recebida', responsavel_producao_id: 3,
    diagnostico_tecnico: '', orcamento_enviado: false, status_aprovacao: 'Pendente', bloqueio_fabricacao: true,
    itens: [{ id: 1 }], ordens_servico: [] };
beforeEach(() => { jest.resetAllMocks(); repo.buscarPorId.mockResolvedValue({ ...manutencao }); repo.atualizar.mockImplementation(async (id, data) => ({ id, ...data })); });
test('somente o técnico atribuído pode registrar o diagnóstico', async () => {
    await expect(service.registrarAvaliacao(9, { diagnostico_tecnico: 'Sensor defeituoso' }, { id: 4 })).rejects.toMatchObject({ status: 403 });
    await expect(service.registrarAvaliacao(9, { diagnostico_tecnico: 'Sensor defeituoso' }, { id: 3 })).resolves.toMatchObject({ diagnostico_tecnico: 'Sensor defeituoso', status: 'Em Avaliacao' });
});
test('não envia orçamento de manutenção antes do diagnóstico', async () => {
    await expect(service.enviarOrcamento(9)).rejects.toMatchObject({ status: 400 });
    expect(repo.atualizar).not.toHaveBeenCalled();
});
test('envia orçamento com diagnóstico, técnico e itens', async () => {
    repo.buscarPorId.mockResolvedValue({ ...manutencao, diagnostico_tecnico: 'Trocar sensor' });
    await expect(service.enviarOrcamento(9)).resolves.toMatchObject({ orcamento_enviado: true, status: 'Pendente', bloqueio_fabricacao: true });
});
test('cliente não aprova orçamento ainda em preparação', async () => {
    portalRepo.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 4 });
    portalRepo.buscarPedidoDoClientePorId.mockResolvedValue({ ...manutencao, cliente_id: 4 });
    await expect(portal.responderAprovacaoOrcamento({ id: 4 }, 9, { status_aprovacao: 'Aprovado' })).rejects.toMatchObject({ status: 400 });
});
test('aprovação com diagnóstico libera manutenção sem checklist de medição', async () => {
    portalRepo.buscarClientePorUsuarioId.mockResolvedValue({ usuario_id: 4 });
    portalRepo.buscarPedidoDoClientePorId.mockResolvedValue({ ...manutencao, cliente_id: 4, diagnostico_tecnico: 'Trocar sensor', orcamento_enviado: true, status: 'Pendente' });
    portalRepo.atualizarPedido.mockImplementation(async (_, data) => data);
    await expect(portal.responderAprovacaoOrcamento({ id: 4 }, 9, { status_aprovacao: 'Aprovado' })).resolves.toMatchObject({ bloqueio_fabricacao: false, status_aprovacao: 'Aprovado' });
});
test('não executa nem aceita serviço antes da aprovação', async () => {
    await expect(service.atualizarStatusEtapa(9, { status: 'Em Atendimento' })).rejects.toMatchObject({ status: 400 });
    await expect(service.coletarAssinaturaAceite(9, { assinatura_cliente_instalacao: 'assinatura' })).rejects.toMatchObject({ status: 400 });
});
test('revisar orçamento invalida a aprovação e bloqueia execução novamente', async () => {
    repo.buscarPorId.mockResolvedValue({ ...manutencao, status: 'Aguardando', orcamento_enviado: true, status_aprovacao: 'Aprovado', diagnostico_tecnico: 'Trocar sensor', bloqueio_fabricacao: false });
    await expect(service.reabrirOrcamento(9)).resolves.toMatchObject({ status_aprovacao: 'Pendente', orcamento_enviado: false, bloqueio_fabricacao: true, data_aprovacao: null });
});
test('não permite aprovar por edição dos dados comerciais', async () => {
    await expect(service.atualizar(9, { status_aprovacao: 'Aprovado' })).rejects.toMatchObject({ status: 400 });
});
test('atribuir técnico coloca a solicitação em avaliação', async () => {
    await service.atualizar(9, { responsavel_producao_id: 3 });
    expect(repo.atualizar).toHaveBeenCalledWith(9, { responsavel_producao_id: 3, status: 'Em Avaliacao' });
});
