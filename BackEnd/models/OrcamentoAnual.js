const Banco = require('./Banco');

module.exports = class OrcamentoAnual {
  constructor() {
    this._idOrcamentoAnual   = null;
    this._valorOrcamentoAnual = null;
    this._anoOrcamentoAnual   = null;
    this._idCategoria         = null;
  }

  // CREATE
  async create() {
    const query = `
      INSERT INTO orcamentosanuais
        (valorOrcamentoAnual, anoOrcamentoAnual, idCategoria)
      VALUES (?, ?, ?)
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.valorOrcamentoAnual,
        this.anoOrcamentoAnual,
        this.idCategoria
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      this._idOrcamentoAnual = resposta.insertId;
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao criar orçamento anual:', err);
      return false;
    }
  }

  // READ ALL
  static async readAll() {
    const query = 'SELECT * FROM orcamentosanuais';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query);
      return rows;
    } catch (err) {
      console.error('Erro ao buscar orçamentos:', err);
      return [];
    }
  }

  // READ BY ID
  static async readById(id) {
    const query = 'SELECT * FROM orcamentosanuais WHERE idOrcamentoAnual = ?';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Erro ao buscar orçamento:', err);
      return null;
    }
  }

  // UPDATE
  async update() {
    const query = `
      UPDATE orcamentosanuais
         SET valorOrcamentoAnual = ?, anoOrcamentoAnual = ?, idCategoria = ?
       WHERE idOrcamentoAnual = ?
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.valorOrcamentoAnual,
        this.anoOrcamentoAnual,
        this.idCategoria,
        this.idOrcamentoAnual
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao atualizar orçamento:', err);
      return false;
    }
  }

  // DELETE
  async delete() {
    const query = 'DELETE FROM orcamentosanuais WHERE idOrcamentoAnual = ?';
    try {
      const conexao = Banco.getConexao();
      const [resposta] = await conexao.promise().execute(query, [this.idOrcamentoAnual]);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao deletar orçamento:', err);
      return false;
    }
  }

  // getters/setters
  get idOrcamentoAnual() {
    return this._idOrcamentoAnual;
  }
  set idOrcamentoAnual(val) {
    this._idOrcamentoAnual = val;
  }

  get valorOrcamentoAnual() {
    return this._valorOrcamentoAnual;
  }
  set valorOrcamentoAnual(val) {
    this._valorOrcamentoAnual = val;
  }

  get anoOrcamentoAnual() {
    return this._anoOrcamentoAnual;
  }
  set anoOrcamentoAnual(val) {
    this._anoOrcamentoAnual = val;
  }

  get idCategoria() {
    return this._idCategoria;
  }
  set idCategoria(val) {
    this._idCategoria = val;
  }
};
