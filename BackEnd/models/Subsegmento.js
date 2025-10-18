const Banco = require('./Banco');

module.exports = class Subsegmento {
    constructor() {
        this._idSubsegmento = null;
        this._nomeSubsegmento = null;
        this._idSegmento = null;
    }

    static async readAll() {
        const query = `
            SELECT 
                s.idSubsegmento, 
                s.nomeSubsegmento, 
                s.idSegmento,        -- ⭐ ADICIONAR ESTA LINHA
                seg.nomeSegmento
            FROM subsegmentos s
            INNER JOIN segmentos seg ON s.idSegmento = seg.idSegmento
        `;
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar subsegmentos:', error);
            return [];
        }
    }

    static async readBySegmento(idSegmento) {
        const query = `
            SELECT 
                s.idSubsegmento, 
                s.nomeSubsegmento,
                s.idSegmento        -- ⭐ ADICIONAR ESTA LINHA TAMBÉM
            FROM subsegmentos s
            WHERE s.idSegmento = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idSegmento]);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar subsegmentos por segmento:', error);
            return [];
        }
    }

    static async readById(idSubsegmento) {
        const query = `
            SELECT 
                s.idSubsegmento, 
                s.nomeSubsegmento, 
                s.idSegmento,        
                seg.nomeSegmento
            FROM subsegmentos s
            INNER JOIN segmentos seg ON s.idSegmento = seg.idSegmento
            WHERE s.idSubsegmento = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idSubsegmento]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Erro ao buscar subsegmento por ID:', error);
            return null;
        }
    }

};