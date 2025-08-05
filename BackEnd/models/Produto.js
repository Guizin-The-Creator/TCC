// models/Produto.js
const Banco = require('./Banco');

module.exports = class Produto {
    constructor() {
        this._idProduto = null;
        this._nomeProduto = null;
        this._custoProduto = null;
        this._idSegmento = null;
        this._idSubsegmento = null;
    }

    // CREATE
    async create() {
        const query = `
      INSERT INTO produtos
        (nomeProduto, custoProduto, idSegmento, idSubsegmento)
      VALUES (?, ?, ?, ?)
    `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.nomeProduto,
                this.custoProduto,
                this.idSegmento,
                this.idSubsegmento
            ];
            const [resposta] = await conexao.promise().execute(query, values);
            this._idProduto = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao criar produto:', err);
            return false;
        }
    }

    // READ ALL
    static async readAll() {
        const query = 'SELECT * FROM produtos';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar produtos:', err);
            return [];
        }
    }

    // READ BY ID
    static async readById(id) {
        const query = 'SELECT * FROM produtos WHERE idProduto = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [id]);
            return rows[0] || null;
        } catch (err) {
            console.error('Erro ao buscar produto:', err);
            return null;
        }
    }

    // UPDATE
    async update() {
        const query = `
      UPDATE produtos
         SET nomeProduto = ?, custoProduto = ?, idSegmento = ?, idSubsegmento = ?
       WHERE idProduto = ?
    `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.nomeProduto,
                this.custoProduto,
                this.idSegmento,
                this.idSubsegmento,
                this.idProduto
            ];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao atualizar produto:', err);
            return false;
        }
    }

    // DELETE
    async delete() {
        const query = 'DELETE FROM produtos WHERE idProduto = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.idProduto]);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao deletar produto:', err);
            return false;
        }
    }

    // getters/setters
    get idProduto()
    { 
        return this._idProduto;
    }
    set idProduto(val) 
    {
         this._idProduto = val;
    }

    get nomeProduto() 
    {
        return this._nomeProduto; 
    }
    set nomeProduto(val) 
    { 
        this._nomeProduto = val;
    }

    get custoProduto() 
    {
        return this._custoProduto; 
    }
    set custoProduto(val) 
    { 
        this._custoProduto = val; 
    }

    get idSegmento() 
    { 
        return this._idSegmento; 
    }
    set idSegmento(val) 
    { 
        this._idSegmento = val; 
    }

    get idSubsegmento() 
    { 
        return this._idSubsegmento; 
    }
    set idSubsegmento(val) 
    { 
        this._idSubsegmento = val; 
    }
};
