const Banco = require('./Banco');

module.exports = class Indice {
  constructor() {
    this._idIndice = null;
    this._nomeIndice = null;
    this._taxaIndice = null;
    this._idSubsegmento = null;
    this._anoIndice = null;
  }

  // CREATE
  async create() {
    const query = `
      INSERT INTO indices
        (nomeIndice, taxaIndice, idSubsegmento, anoIndice)
      VALUES (?, ?, ?, ?)
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.nomeIndice,
        this.taxaIndice,
        this.idSubsegmento,
        this.anoIndice
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      this._idIndice = resposta.insertId;
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao criar índice:', err);
      return false;
    }
  }

  // READ ALL
  static async readAll() {
    const query = 'SELECT * FROM indices';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query);
      return rows;
    } catch (err) {
      console.error('Erro ao buscar índices:', err);
      return [];
    }
  }

  // READ BY ID
  static async readById(id) {
    const query = 'SELECT * FROM indices WHERE idIndice = ?';
    try {
      const conexao = Banco.getConexao();
      const [rows] = await conexao.promise().execute(query, [id]);
      return rows[0] || null;
    } catch (err) {
      console.error('Erro ao buscar índice:', err);
      return null;
    }
  }

  // UPDATE
  async update() {
    const query = `
      UPDATE indices
         SET nomeIndice = ?, taxaIndice = ?, idSubsegmento = ?, anoIndice = ?
       WHERE idIndice = ?
    `;
    try {
      const conexao = Banco.getConexao();
      const values = [
        this.nomeIndice,
        this.taxaIndice,
        this.idSubsegmento,
        this.anoIndice,
        this.idIndice
      ];
      const [resposta] = await conexao.promise().execute(query, values);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao atualizar índice:', err);
      return false;
    }
  }

  // DELETE
  async delete() {
    const query = 'DELETE FROM indices WHERE idIndice = ?';
    try {
      const conexao = Banco.getConexao();
      const [resposta] = await conexao.promise().execute(query, [this.idIndice]);
      return resposta.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao deletar índice:', err);
      return false;
    }
  }

  // getters/setters
  get idIndice() {
    return this._idIndice;
  }
  set idIndice(val) {
    this._idIndice = val;
  }

  get nomeIndice() {
    return this._nomeIndice;
  }
  set nomeIndice(val) {
    this._nomeIndice = val;
  }

  get taxaIndice() {
    return this._taxaIndice;
  }
  set taxaIndice(val) {
    this._taxaIndice = val;
  }

  get idSubsegmento() {
    return this._idSubsegmento;
  }
  set idSubsegmento(val) {
    this._idSubsegmento = val;
  }

  get anoIndice() {
    return this._anoIndice;
  }
  set anoIndice(val) {
    this._anoIndice = val;
  }
};