const Banco = require('./Banco');

module.exports = class OrcamentoTri {
  constructor() {
    this._idOrcamentoTri          = null;
    this._valorOrcamentoTri       = null;
    this._trimestreOrcamentoTri   = null;
    this._idOrcamentoAnual        = null;
    this._idCategoria             = null;
  }

  // CREATE
  async create() {
    const query = `
      INSERT INTO orcamentostri
        (valorOrcamentoTri, trimestreOrcamentoTri, idOrcamentoAnual, idCategoria)
      VALUES (?, ?, ?, ?)
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.valorOrcamentoTri,
        this.trimestreOrcamentoTri,
        this.idOrcamentoAnual,
        this.idCategoria
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      this._idOrcamentoTri = resposta.insertId;
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao criar orçamento trimestral:', err);
      return false;
    }
  }

  // READ ALL
  static async readAll() {
    const query = 'SELECT * FROM orcamentostri';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query);
      return rows;
    } catch (err) {
      console.error('Erro ao buscar orçamentos trimestrais:', err);
      return [];
    }
  }

  // READ BY ID
  static async readById(id) {
    const query = 'SELECT * FROM orcamentostri WHERE idOrcamentoTri = ?';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Erro ao buscar orçamento trimestral:', err);
      return null;
    }
  }

  // UPDATE
  async update() {
    const query = `
      UPDATE orcamentostri
         SET valorOrcamentoTri = ?,
             trimestreOrcamentoTri = ?,
             idOrcamentoAnual = ?,
             idCategoria = ?
       WHERE idOrcamentoTri = ?
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.valorOrcamentoTri,
        this.trimestreOrcamentoTri,
        this.idOrcamentoAnual,
        this.idCategoria,
        this.idOrcamentoTri
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao atualizar orçamento trimestral:', err);
      return false;
    }
  }

  // DELETE
  async delete() {
    const query = 'DELETE FROM orcamentostri WHERE idOrcamentoTri = ?';
    try {
      const conexao = Banco.getConexao();
      const [resposta] = await conexao.promise().execute(query, [this.idOrcamentoTri]);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao deletar orçamento trimestral:', err);
      return false;
    }
  }

  // getters / setters
  get idOrcamentoTri() {
    return this._idOrcamentoTri;
  }
  set idOrcamentoTri(val) {
    this._idOrcamentoTri = val;
  }

  get valorOrcamentoTri() {
    return this._valorOrcamentoTri;
  }
  set valorOrcamentoTri(val) {
    this._valorOrcamentoTri = val;
  }

  get trimestreOrcamentoTri() {
    return this._trimestreOrcamentoTri;
  }
  set trimestreOrcamentoTri(val) {
    this._trimestreOrcamentoTri = val;
  }

  get idOrcamentoAnual() {
    return this._idOrcamentoAnual;
  }
  set idOrcamentoAnual(val) {
    this._idOrcamentoAnual = val;
  }

  get idCategoria() {
    return this._idCategoria;
  }
  set idCategoria(val) {
    this._idCategoria = val;
  }
};
