const Indice = require('../models/Indice');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class IndiceController {
  // POST /indices
  Indice_create_controller = async (req, res) => {
    const ind = new Indice();
    ind.nomeIndice = req.body.nomeIndice;
    ind.taxaIndice = req.body.taxaIndice;
    ind.idSubsegmento = req.body.idSubsegmento;
    ind.anoIndice = req.body.anoIndice;

    const sucesso = await ind.create();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(201).send({
        status: true,
        message: 'Índice criado com sucesso',
        indice: ind,
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao criar índice',
      token
    });
  }

  // GET /indices
  Indice_readAll_controller = async (req, res) => {
    const lista = await Indice.readAll();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    return res.status(200).send({
      status: true,
      message: 'Índices encontrados com sucesso',
      indices: lista,
      token
    });
  }

  // GET /indices/:id
  Indice_readById_controller = async (req, res) => {
    const id = req.params.id;
    const ind = await Indice.readById(id);
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (ind) {
      return res.status(200).send({
        status: true,
        message: 'Índice encontrado',
        indice: ind,
        token
      });
    }
    return res.status(404).send({
      status: false,
      message: 'Índice não encontrado',
      token
    });
  }

  // PUT /indices/:id
  Indice_update_controller = async (req, res) => {
    const ind = new Indice();
    ind.idIndice = req.params.id;
    ind.nomeIndice = req.body.nomeIndice;
    ind.taxaIndice = req.body.taxaIndice;
    ind.idSubsegmento = req.body.idSubsegmento;
    ind.anoIndice = req.body.anoIndice;

    const sucesso = await ind.update();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Índice atualizado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao atualizar índice',
      token
    });
  }

  // DELETE /indices/:id
  Indice_delete_controller = async (req, res) => {
    const ind = new Indice();
    ind.idIndice = req.params.id;

    const sucesso = await ind.delete();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Índice deletado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao deletar índice',
      token
    });
  }
};