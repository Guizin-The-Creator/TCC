// controllers/CategoriaController.js
const Categoria = require('../models/Categoria');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class CategoriaController {

  // Ler todos
  Categoria_readAll_controller = async (req, res) => {
    try {
      const categorias = await Categoria.readAll();
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);

      if (categorias && categorias.length > 0) {
        return res.status(200).send({
          status: true,
          message: 'Categorias encontradas com sucesso',
          data: categorias,
          token
        });
      } else {
        return res.status(200).send({
          status: true,
          message: 'Nenhuma categoria encontrada',
          data: [],
          token
        });
      }
    } catch (error) {
      console.error('Erro ao ler categorias:', error);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);
      return res.status(500).send({
        status: false,
        message: 'Erro interno ao buscar categorias',
        token
      });
    }
  }

  // Ler por id
  Categoria_readById_controller = async (req, res) => {
    try {
      const id = req.params.id;
      const categoria = await Categoria.readById(id);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);

      if (categoria) {
        return res.status(200).send({
          status: true,
          message: 'Categoria encontrada',
          data: categoria,
          token
        });
      } else {
        return res.status(404).send({
          status: false,
          message: 'Categoria não encontrada',
          token
        });
      }
    } catch (error) {
      console.error('Erro ao ler categoria por id:', error);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);
      return res.status(500).send({
        status: false,
        message: 'Erro interno ao buscar categoria',
        token
      });
    }
  }
};
