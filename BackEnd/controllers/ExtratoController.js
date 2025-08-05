const Extrato = require('../models/Extrato');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class ExtratoController {
  Extrato_create_controller = async (req, res) => {
    const extrato = new Extrato();
    extrato.tipoExtrato = req.body.tipoExtrato;
    extrato.valorExtrato = req.body.valorExtrato;
    extrato.dataExtrato = req.body.dataExtrato;
    extrato.idTarefa = req.body.idTarefa || null;
    extrato.idLancamento = req.body.idLancamento || null;
    extrato.idCategoria = req.body.idCategoria || null;
    extrato.idSubcategoria = req.body.idSubcategoria || null;
    extrato.idProduto = req.body.idProduto || null;

    const sucesso = await extrato.create();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(201).send({
        status: true,
        message: 'Extrato criado com sucesso',
        extrato,
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao criar extrato',
      token
    });
  }

  Extrato_readAll_controller = async (req, res) => {
    const lista = await Extrato.readAll();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    return res.status(200).send({
      status: true,
      message: 'Extratos encontrados com sucesso',
      extratos: lista,
      token
    });
  }

  Extrato_readById_controller = async (req, res) => {
    const extrato = await Extrato.readById(req.params.id);
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (extrato) {
      return res.status(200).send({
        status: true,
        message: 'Extrato encontrado',
        extrato,
        token
      });
    }
    return res.status(404).send({
      status: false,
      message: 'Extrato não encontrado',
      token
    });
  }

  Extrato_update_controller = async (req, res) => {
    const extrato = new Extrato();
    extrato.idExtrato = req.params.id;
    extrato.tipoExtrato = req.body.tipoExtrato;
    extrato.valorExtrato = req.body.valorExtrato;
    extrato.dataExtrato = req.body.dataExtrato;
    extrato.idTarefa = req.body.idTarefa || null;
    extrato.idLancamento = req.body.idLancamento || null;
    extrato.idCategoria = req.body.idCategoria || null;
    extrato.idSubcategoria = req.body.idSubcategoria || null;
    extrato.idProduto = req.body.idProduto || null;

    const sucesso = await extrato.update();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Extrato atualizado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao atualizar extrato',
      token
    });
  }

  Extrato_delete_controller = async (req, res) => {
    const extrato = new Extrato();
    extrato.idExtrato = req.params.id;

    const sucesso = await extrato.delete();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Extrato deletado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao deletar extrato',
      token
    });
  }
};
