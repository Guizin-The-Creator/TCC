const Banco = require('./Banco');

module.exports = class Lancamento {
    constructor() {
        this._idLancamento = null;
        this._tituloLancamento = null;
        this._descricaoLancamento = null;
        this._vencimentoLancamento = null;
        this._valorLancamento = null;
        this._classificacaoLancamento = null;
        this._pagamentoLancamento = null;
        this._statusLancamento = null;
        this._idCategoria = null;
        this._idSubcategoria = null;

    }

    // CREATE
    async create() {
        const query = `
      INSERT INTO lancamentos
        (tituloLancamento, descricaoLancamento, vencimentoLancamento, valorLancamento, classificacaoLancamento, pagamentoLancamento, statusLancamento, idCategoria, idSubcategoria)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)

    `;
        const values = [
            this.tituloLancamento,
            this.descricaoLancamento,
            this.vencimentoLancamento,
            this.valorLancamento,
            this.classificacaoLancamento,
            this.pagamentoLancamento,
            this.statusLancamento,
            this.idCategoria,
            this.idSubcategoria
        ];
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, values);
            this._idLancamento = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao criar lançamento:', err);
            return false;
        }
    }

    // READ ALL
    static async readAll() {
        const query = 'SELECT * FROM lancamentos';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (err) {
            console.error('Erro ao buscar lançamentos:', err);
            return [];
        }
    }

    // READ BY ID
    static async readById(id) {
        const query = 'SELECT * FROM lancamentos WHERE idLancamento = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [id]);
            return rows[0] || null;
        } catch (err) {
            console.error('Erro ao buscar lançamento:', err);
            return null;
        }
    }

    // UPDATE
    async update() {
        const query = `
        UPDATE lancamentos SET 
            tituloLancamento = ?, 
            descricaoLancamento = ?, 
            vencimentoLancamento = ?, 
            valorLancamento = ?, 
            classificacaoLancamento = ?, 
            pagamentoLancamento = ?, 
            statusLancamento = ?, 
            idCategoria = ?, 
            idSubcategoria = ?
        WHERE idLancamento = ?
    `;
        const values = [
            this.tituloLancamento,
            this.descricaoLancamento,
            this.vencimentoLancamento,
            this.valorLancamento,
            this.classificacaoLancamento,
            this.pagamentoLancamento,
            this.statusLancamento,
            this.idCategoria,
            this.idSubcategoria,
            this.idLancamento

        ];
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao atualizar lançamento:', err);
            return false;
        }
    }

    // DELETE
    async delete() {
        const query = 'DELETE FROM lancamentos WHERE idLancamento = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.idLancamento]);
            return resposta.affectedRows > 0;
        } catch (err) {
            console.error('Erro ao deletar lançamento:', err);
            return false;
        }
    }

    // getters/setters
    get idLancamento() {
        return this._idLancamento;
    }
    set idLancamento(val) {
        this._idLancamento = val;
    }

    get vencimentoLancamento() {
        return this._vencimentoLancamento;
    }
    set vencimentoLancamento(val) {
        this._vencimentoLancamento = val;

    }

    get valorLancamento() {
        return this._valorLancamento;

    }
    set valorLancamento(val) {
        this._valorLancamento = val;

    }

    get classificacaoLancamento() {
        return this._classificacaoLancamento;

    }
    set classificacaoLancamento(val) {
        this._classificacaoLancamento = val;

    }

    get pagamentoLancamento() {
        return this._pagamentoLancamento;

    }
    set pagamentoLancamento(val) {
        this._pagamentoLancamento = val;

    }

    get statusLancamento() {
        return this._statusLancamento;

    }
    set statusLancamento(val) {
        this._statusLancamento = val;

    }

    get idCategoria() {
        return this._idCategoria;

    }
    set idCategoria(val) {
        this._idCategoria = val;

    }

    get idSubcategoria() {
        return this._idSubcategoria;

    }
    set idSubcategoria(val) {
        this._idSubcategoria = val;

    }

    get tituloLancamento() { return this._tituloLancamento; }
    set tituloLancamento(val) { this._tituloLancamento = val; }

    get descricaoLancamento() { return this._descricaoLancamento; }
    set descricaoLancamento(val) { this._descricaoLancamento = val; }
};
