// models/Categoria.js
const Banco = require('./Banco');

module.exports = class Categoria {
    constructor() {
        this._idCategoria = null;
        this._nomeCategoria = null;
    }

    static async readAll() {
        const query = 'SELECT idCategoria, nomeCategoria FROM categorias ORDER BY nomeCategoria';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return [];
        }
    }

    static async readById(idCategoria) {
        const query = 'SELECT idCategoria, nomeCategoria FROM categorias WHERE idCategoria = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idCategoria]);
            return rows.length ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar categoria por id:', error);
            return null;
        }
    }

    // getters / setters opcionais se precisar criar/atualizar no futuro
    get idCategoria() { return this._idCategoria; }
    set idCategoria(v) { this._idCategoria = v; }

    get nomeCategoria() { return this._nomeCategoria; }
    set nomeCategoria(v) { this._nomeCategoria = v; }
};
