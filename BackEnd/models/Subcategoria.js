// models/Subcategoria.js
const Banco = require('./Banco');

module.exports = class Subcategoria {
  constructor() {
    this._idSubcategoria = null;
    this._nomeSubcategoria = null;
    this._idCategoria = null;
  }

  static async readAll() {
    const query = 'SELECT idSubcategoria, nomeSubcategoria, idCategoria FROM subcategorias ORDER BY nomeSubcategoria';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query);
      return rows;
    } catch (error) {
      console.error('Erro ao buscar subcategorias:', error);
      return [];
    }
  }

  static async readById(id) {
    const query = 'SELECT idSubcategoria, nomeSubcategoria, idCategoria FROM subcategorias WHERE idSubcategoria = ?';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error('Erro ao buscar subcategoria por id:', error);
      return null;
    }
  }

  static async readByCategoria(idCategoria) {
    const query = 'SELECT idSubcategoria, nomeSubcategoria, idCategoria FROM subcategorias WHERE idCategoria = ? ORDER BY nomeSubcategoria';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query, [idCategoria]);
      return rows;
    } catch (error) {
      console.error('Erro ao buscar subcategorias por categoria:', error);
      return [];
    }
  }

  get idSubcategoria() { return this._idSubcategoria; }
  set idSubcategoria(v) { this._idSubcategoria = v; }

  get nomeSubcategoria() { return this._nomeSubcategoria; }
  set nomeSubcategoria(v) { this._nomeSubcategoria = v; }

  get idCategoria() { return this._idCategoria; }
  set idCategoria(v) { this._idCategoria = v; }
};
