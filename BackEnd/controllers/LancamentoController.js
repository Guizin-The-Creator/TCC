const Lancamento = require('../models/Lancamento');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class LancamentoController {
  Lancamento_create_controller = async (req, res) => {
    const lanc = new Lancamento();
    lanc.vencimentoLancamento = req.body.vencimentoLancamento;
    lanc.valorLancamento = req.body.valorLancamento;
    lanc.classificacaoLancamento = req.body.classificacaoLancamento;
    lanc.pagamentoLancamento = req.body.pagamentoLancamento;
    lanc.statusLancamento = req.body.statusLancamento;
    lanc.idCategoria = req.body.idCategoria;
    lanc.idSubcategoria = req.body.idSubcategoria;

    const sucesso = await lanc.create();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(201).send({
        status: true,
        message: 'Lançamento criado com sucesso',
        lancamento: lanc,
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao criar lançamento',
      token
    });
  }

  Lancamento_readAll_controller = async (req, res) => {
    const lista = await Lancamento.readAll();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    return res.status(200).send({
      status: true,
      message: 'Lançamentos encontrados com sucesso',
      lancamentos: lista,
      token
    });
  }

  Lancamento_readById_controller = async (req, res) => {
    const lanc = await Lancamento.readById(req.params.id);
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (lanc) {
      return res.status(200).send({
        status: true,
        message: 'Lançamento encontrado',
        lancamento: lanc,
        token
      });
    }
    return res.status(404).send({
      status: false,
      message: 'Lançamento não encontrado',
      token
    });
  }

  Lancamento_update_controller = async (req, res) => {
    const lanc = new Lancamento();
    lanc.idLancamento = req.params.id;
    lanc.vencimentoLancamento = req.body.vencimentoLancamento;
    lanc.valorLancamento = req.body.valorLancamento;
    lanc.classificacaoLancamento = req.body.classificacaoLancamento;
    lanc.pagamentoLancamento = req.body.pagamentoLancamento;
    lanc.statusLancamento = req.body.statusLancamento;
    lanc.idCategoria = req.body.idCategoria;
    lanc.idSubcategoria = req.body.idSubcategoria;

    const sucesso = await lanc.update();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Lançamento atualizado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao atualizar lançamento',
      token
    });
  }

  Lancamento_delete_controller = async (req, res) => {
    const lanc = new Lancamento();
    lanc.idLancamento = req.params.id;

    const sucesso = await lanc.delete();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Lançamento deletado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao deletar lançamento',
      token
    });
  }
};
