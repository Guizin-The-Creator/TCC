const Banco = require('./Banco');

module.exports = class Cargo {
    constructor() {
        this._idCargo = null;
        this._nomeCargo = null;
        this._prioridadeCargo = null;
    }

    async create() {
        const query = 'INSERT INTO cargos (nomeCargo, prioridadeCargo) VALUES (?, ?)';
        try {
            const conexao = Banco.getConexao();
            const values = [this._nomeCargo, this._prioridadeCargo];
            const [resposta] = await conexao.promise().execute(query, values);
            this._idCargo = resposta.insertId;
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao criar cargo:', error);
            return false;
        }
    }

    static async readAll() {
        const query = 'SELECT * FROM cargos';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query);
            return resposta;
        } catch (error) {
            console.error('Erro ao buscar todos os cargos:', error);
            return [];
        }
    }

    /**
     * Lê um cargo pelo seu ID e retorna uma instância de Cargo ou null se não existir.
     * @param {number} idCargo 
     * @returns {Cargo|null}
     */
    static async readById(idCargo) {
        const query = 'SELECT * FROM cargos WHERE idCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idCargo]);

            if (rows.length === 1) {
                const row = rows[0];
                const cargo = new Cargo();
                cargo.idCargo = row.idCargo;
                cargo.nomeCargo = row.nomeCargo;
                return cargo;
            }

            return null;
        } catch (error) {
            console.error('Erro ao buscar cargo por ID:', error);
            return null;
        }
    }

    async update() {
        const query = 'UPDATE cargos SET nomeCargo = ?, prioridadeCargo = ? WHERE idCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const values = [this._nomeCargo, this._prioridadeCargo, this._idCargo];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar cargo:', error);
            return false;
        }
    }

    static async delete(idCargo) {
        const query = 'DELETE FROM cargos WHERE idCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idCargo]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar cargo:', error);
            return false;
        }
    }

    /**
 * Busca um cargo pelo nome.
 * Retorna uma instância de Cargo ou null se não encontrado.
 */
    static async findByNome(nome) {
        const query = 'SELECT * FROM cargos WHERE nomeCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [nome]);
            if (resposta.length > 0) {
                const row = resposta[0];
                const cargo = new Cargo();
                cargo.idCargo = row.idCargo;
                cargo.nomeCargo = row.nomeCargo;
                cargo.prioridadeCargo = row.prioridadeCargo;
                return cargo;
            }
            return null;
        } catch (error) {
            console.error('Erro ao buscar cargo por nome:', error);
            return null;
        }
    }



    static async isCargo(idCargo) {
        const query = 'SELECT COUNT(*) as qtd FROM cargos WHERE idCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idCargo]);
            return resposta[0].qtd > 0;
        } catch (error) {
            console.error('Erro ao verificar existência do cargo:', error);
            return false;
        }
    }

    get idCargo() {
        return this._idCargo;
    }

    set idCargo(idCargo) {
        this._idCargo = idCargo;
    }

    get nomeCargo() {
        return this._nomeCargo;
    }

    set nomeCargo(nomeCargo) {
        this._nomeCargo = nomeCargo;
    }

    get prioridadeCargo() {
        return this._prioridadeCargo;
    }

    set prioridadeCargo(prioridadeCargo) {
        this._prioridadeCargo = prioridadeCargo;
    }
}
