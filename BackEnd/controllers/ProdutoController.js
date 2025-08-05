const Produto = require('../models/Produto');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class ProdutoController {
  Produto_create_controller = async (req, res) => {
    const prod = new Produto();
    prod.nomeProduto = req.body.nomeProduto;
    prod.custoProduto = req.body.custoProduto;
    prod.idSegmento = req.body.idSegmento;
    prod.idSubsegmento = req.body.idSubsegmento;

    const sucesso = await prod.create();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(201).send({
        status: true,
        message: 'Produto criado com sucesso',
        produto: prod,
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao criar produto',
      token
    });
  }

  Produto_readAll_controller = async (req, res) => {
    const lista = await Produto.readAll();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    return res.status(200).send({
      status: true,
      message: 'Produtos encontrados com sucesso',
      produtos: lista,
      token
    });
  }

  Produto_readById_controller = async (req, res) => {
    const id = req.params.id;
    const prod = await Produto.readById(id);
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (prod) {
      return res.status(200).send({
        status: true,
        message: 'Produto encontrado',
        produto: prod,
        token
      });
    }
    return res.status(404).send({
      status: false,
      message: 'Produto não encontrado',
      token
    });
  }

  Produto_update_controller = async (req, res) => {
    const prod = new Produto();
    prod.idProduto = req.params.id;
    prod.nomeProduto = req.body.nomeProduto;
    prod.custoProduto = req.body.custoProduto;
    prod.idSegmento = req.body.idSegmento;
    prod.idSubsegmento = req.body.idSubsegmento;

    const sucesso = await prod.update();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Produto atualizado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao atualizar produto',
      token
    });
  }

  Produto_delete_controller = async (req, res) => {
    const prod = new Produto();
    prod.idProduto = req.params.id;

    const sucesso = await prod.delete();
    const jwt = new MeuTokenJWT();
    const token = jwt.gerarToken(req.user);

    if (sucesso) {
      return res.status(200).send({
        status: true,
        message: 'Produto deletado com sucesso',
        token
      });
    }
    return res.status(500).send({
      status: false,
      message: 'Erro ao deletar produto',
      token
    });
  }
};
