const Banco = require('./Banco');

module.exports = class Segmento {
    constructor() {
        this._idSegmento = null;
        this._nomeSegmento = null;
    }

    static async readAll() {
        const query = 'SELECT * FROM segmentos';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar segmentos:', error);
            return [];
        }
    }

    static async readById(idSegmento) {
        const query = 'SELECT * FROM segmentos WHERE idSegmento = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idSegmento]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar segmento por ID:', error);
            return null;
        }
    }

    get idSegmento() { return this._idSegmento; }
    set idSegmento(v) { this._idSegmento = v; }

    get nomeSegmento() { return this._nomeSegmento; }
    set nomeSegmento(v) { this._nomeSegmento = v; }
};
