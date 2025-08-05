const Banco = require('./Banco');

module.exports = class Extrato {
    constructor() {
        this._idExtrato = null;
        this._tipoExtrato = null;
        this._valorExtrato = null;
        this._dataExtrato = null;
        this._idTarefa = null;
        this._idLancamento = null;
        this._idCategoria = null;
        this._idSubcategoria = null;
        this._idProduto = null;
    }

    // CREATE
    async create() {
        const query = `
            INSERT INTO extratos 
                (tipoExtrato, valorExtrato, dataExtrato, idTarefa, idLancamento, idCategoria, idSubcategoria, idProduto) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            this.tipoExtrato,
            this.valorExtrato,
            this.dataExtrato,
            this.idTarefa,
            this.idLancamento,
            this.idCategoria,
            this.idSubcategoria,
            this.idProduto
        ];
        
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, values);
            this._idExtrato = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao criar extrato:', err);
            return false;
        }
    }

    // READ ALL
    static async readAll() {
        const query = 'SELECT * FROM extratos';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar extratos:', err);
            return [];
        }
    }

    // READ BY ID
    static async readById(id) {
        const query = 'SELECT * FROM extratos WHERE idExtrato = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [id]);
            return rows[0] || null;
        } catch (err) {
            console.error('Erro ao buscar extrato:', err);
            return null;
        }
    }

    // UPDATE
    async update() {
        const query = `
            UPDATE extratos 
               SET tipoExtrato = ?, 
                   valorExtrato = ?, 
                   dataExtrato = ?,
                   idTarefa = ?,
                   idLancamento = ?,
                   idCategoria = ?,
                   idSubcategoria = ?,
                   idProduto = ?
             WHERE idExtrato = ?
        `;
        const values = [
            this.tipoExtrato,
            this.valorExtrato,
            this.dataExtrato,
            this.idTarefa,
            this.idLancamento,
            this.idCategoria,
            this.idSubcategoria,
            this.idProduto,
            this.idExtrato
        ];
        
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao atualizar extrato:', err);
            return false;
        }
    }

    // DELETE
    async delete() {
        const query = 'DELETE FROM extratos WHERE idExtrato = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.idExtrato]);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao deletar extrato:', err);
            return false;
        }
    }

    // GETTERS/SETTERS
    get idExtrato() { return this._idExtrato; }
    set idExtrato(val) { this._idExtrato = val; }

    get tipoExtrato() { return this._tipoExtrato; }
    set tipoExtrato(val) { this._tipoExtrato = val; }

    get valorExtrato() { return this._valorExtrato; }
    set valorExtrato(val) { this._valorExtrato = val; }

    get dataExtrato() { return this._dataExtrato; }
    set dataExtrato(val) { this._dataExtrato = val; }

    get idTarefa() { return this._idTarefa; }
    set idTarefa(val) { this._idTarefa = val; }

    get idLancamento() { return this._idLancamento; }
    set idLancamento(val) { this._idLancamento = val; }

    get idCategoria() { return this._idCategoria; }
    set idCategoria(val) { this._idCategoria = val; }

    get idSubcategoria() { return this._idSubcategoria; }
    set idSubcategoria(val) { this._idSubcategoria = val; }

    get idProduto() { return this._idProduto; }
    set idProduto(val) { this._idProduto = val; }
};