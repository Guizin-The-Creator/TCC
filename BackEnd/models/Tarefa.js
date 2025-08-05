const Banco = require('./Banco');

module.exports = class Tarefa {
    constructor() {
        this._idTarefa = null;
        this._tituloTarefa = null;
        this._descricaoTarefa = null;
        this._prioridadeTarefa = null;  // novo
        this._dataInicio = null;
        this._dataFim = null;
        this._valorOpc = null;
    }

    async create() {
        const query = `
            INSERT INTO tarefas (tituloTarefa, descricaoTarefa, prioridadeTarefa, dataInicio, dataFim, valorOpc)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.tituloTarefa,
                this.descricaoTarefa,
                this.prioridadeTarefa,  // novo
                this.dataInicio,
                this.dataFim,
                this.valorOpc
            ];
            const [resposta] = await conexao.promise().execute(query, values);
            this._idTarefa = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao criar tarefa:', error);
            return false;
        }
    }

    static async readAll() {
        const query = 'SELECT * FROM tarefas';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query);
            return resposta;
        } catch (error) {
            console.error('Erro ao buscar todas as tarefas:', error);
            return [];
        }
    }

    static async readById(idTarefa) {
        const query = 'SELECT * FROM tarefas WHERE idTarefa = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idTarefa]);
            return resposta[0] || null;
        } catch (error) {
            console.error('Erro ao buscar a tarefa:', error);
            return null;
        }
    }

    async update() {
        const query = `
            UPDATE tarefas
            SET tituloTarefa = ?, descricaoTarefa = ?, prioridadeTarefa = ?, dataInicio = ?, dataFim = ?, valorOpc = ?
            WHERE idTarefa = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.tituloTarefa,
                this.descricaoTarefa,
                this.prioridadeTarefa,  // novo
                this.dataInicio,
                this.dataFim,
                this.valorOpc,
                this.idTarefa
            ];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error);
            return false;
        }
    }

    async delete() {
        const query = 'DELETE FROM tarefas WHERE idTarefa = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.idTarefa]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error);
            return false;
        }
    }

    get idTarefa() {
        return this._idTarefa;
    }
    set idTarefa(idTarefa) {
        this._idTarefa = idTarefa;
    }

    get tituloTarefa() {
        return this._tituloTarefa;
    }
    set tituloTarefa(tituloTarefa) {
        this._tituloTarefa = tituloTarefa;
    }

    get descricaoTarefa() {
        return this._descricaoTarefa;
    }
    set descricaoTarefa(descricaoTarefa) {
        this._descricaoTarefa = descricaoTarefa;
    }

    get prioridadeTarefa() {
        return this._prioridadeTarefa;
    }
    set prioridadeTarefa(prioridadeTarefa) {
        this._prioridadeTarefa = prioridadeTarefa;
    }

    get dataInicio() {
        return this._dataInicio;
    }
    set dataInicio(dataInicio) {
        this._dataInicio = dataInicio;
    }

    get dataFim() {
        return this._dataFim;
    }
    set dataFim(dataFim) {
        this._dataFim = dataFim;
    }

    get valorOpc() {
        return this._valorOpc;
    }
    set valorOpc(valorOpc) {
        this._valorOpc = valorOpc;
    }
};
