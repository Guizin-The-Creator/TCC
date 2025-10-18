// controllers/SubcategoriaController.js
const Subcategoria = require('../models/Subcategoria');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class SubcategoriaController {

  // Ler todas
  Subcategoria_readAll_controller = async (req, res) => {
    try {
      const subcats = await Subcategoria.readAll();
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);

      return res.status(200).send({
        status: true,
        message: 'Subcategorias retornadas',
        data: subcats,
        token
      });
    } catch (error) {
      console.error('Erro ao ler subcategorias:', error);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);
      return res.status(500).send({
        status: false,
        message: 'Erro interno ao buscar subcategorias',
        token
      });
    }
  }

  // Ler por id
  Subcategoria_readById_controller = async (req, res) => {
    try {
      const id = req.params.id;
      const subcat = await Subcategoria.readById(id);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);

      if (subcat) {
        return res.status(200).send({
          status: true,
          message: 'Subcategoria encontrada',
          data: subcat,
          token
        });
      } else {
        return res.status(404).send({
          status: false,
          message: 'Subcategoria não encontrada',
          token
        });
      }
    } catch (error) {
      console.error('Erro ao ler subcategoria por id:', error);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);
      return res.status(500).send({
        status: false,
        message: 'Erro interno ao buscar subcategoria',
        token
      });
    }
  }

  // Ler por categoria (idCategoria)
  Subcategoria_readByCategoria_controller = async (req, res) => {
    try {
      const categoriaId = req.params.categoriaId;
      const subcats = await Subcategoria.readByCategoria(categoriaId);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);

      return res.status(200).send({
        status: true,
        message: `Subcategorias da categoria ${categoriaId}`,
        data: subcats,
        token
      });
    } catch (error) {
      console.error('Erro ao ler subcategorias por categoria:', error);
      const jwt = new MeuTokenJWT();
      const token = jwt.gerarToken(req.user);
      return res.status(500).send({
        status: false,
        message: 'Erro interno ao buscar subcategorias por categoria',
        token
      });
    }
  }
};
