const OrcamentoAnual = require('../models/OrcamentoAnual');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class OrcamentoAnualController {
  // POST /orcamentosanuais
  OrcamentoAnual_create_controller = async (req, res) => {
    const orc = new OrcamentoAnual();
    orc.valorOrcamentoAnual = req.body.valorOrcamentoAnual;
    orc.anoOrcamentoAnual = req.body.anoOrcamentoAnual;
    orc.idCategoria = req.body.idCategoria;

    const sucesso = await orc.create();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(201).send({
        status: true,
        message: 'Orçamento anual criado com sucesso',
        orcamento: orc,
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao criar orçamento anual',
      token
    });
  }

  // GET /orcamentosanuais
  OrcamentoAnual_readAll_controller = async (req, res) => {
    const lista = await OrcamentoAnual.readAll();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    return res.status(200).send({
      status: true,
      message: 'Orçamentos anuais encontrados com sucesso',
      orcamentos: lista,
      token
    });
  }

  // GET /orcamentosanuais/:id
  OrcamentoAnual_readById_controller = async (req, res) => {
    const id = req.params.id;
    const orc = await OrcamentoAnual.readById(id);
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (orc) {
      return res.status(200).send({
        status: true,
        message: 'Orçamento anual encontrado',
        orcamento: orc,
        token
      });
    }
    return res.status(404).send({
      status: false,
      message: 'Orçamento anual não encontrado',
      token
    });
  }

  // PUT /orcamentosanuais/:id
  OrcamentoAnual_update_controller = async (req, res) => {
    const orc = new OrcamentoAnual();
    orc.idOrcamentoAnual = req.params.id;
    orc.valorOrcamentoAnual = req.body.valorOrcamentoAnual;
    orc.anoOrcamentoAnual = req.body.anoOrcamentoAnual;
    orc.idCategoria = req.body.idCategoria;

    const sucesso = await orc.update();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Orçamento anual atualizado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao atualizar orçamento anual',
      token
    });
  }

  // DELETE /orcamentosanuais/:id
  OrcamentoAnual_delete_controller = async (req, res) => {
    const orc = new OrcamentoAnual();
    orc.idOrcamentoAnual = req.params.id;

    const sucesso = await orc.delete();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Orçamento anual deletado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao deletar orçamento anual',
      token
    });
  }
};
