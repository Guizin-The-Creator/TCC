// models/Usuario.js
const Banco = require('./Banco');
const Cargo = require('./Cargo');

module.exports = class Usuario {
    constructor() {
        this._idUsuario = null;
        this._nomeUsuario = null;
        this._emailUsuario = null;
        this._senhaUsuario = null;
        this._dataCadastro = null;
        this._idCargo = null;
        this._nomeCargo = null;
    }

    /**
     * Cria um novo usuário. Após inserir, busca o nome do cargo e preenche this._nomeCargo.
     * @returns {boolean} true se criar com sucesso, false caso contrário
     */
    async create() {
        const query = `
            INSERT INTO usuarios (nomeUsuario, emailUsuario, senhaUsuario, dataCadastro, idCargo)
            VALUES (?, ?, MD5(?), ?, ?)
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.nomeUsuario,
                this.emailUsuario,
                this.senhaUsuario,
                this.dataCadastro,
                this.idCargo
            ];

            const [resposta] = await conexao.promise().execute(query, values);
            this._idUsuario = resposta.insertId;

            // Após criar, buscar nome do cargo e preencher this._nomeCargo
            const cargo = await Cargo.readById(this.idCargo);
            if (cargo) {
                this._nomeCargo = cargo.nomeCargo;
            }

            return true;
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return false;
        }
    }

    /**
     * Busca todos os usuários (sem nomeCargo).
     * @returns {Array<Object>} lista de usuários brutos
     */
    static async readAll() {
        const query = 'SELECT * FROM usuarios';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query);
            return rows;
        } catch (error) {
            console.error('Erro ao buscar todos os usuários:', error);
            return [];
        }
    }

    /**
     * Busca um usuário pelo ID (retorna apenas os campos da tabela, sem nomeCargo).
     * @param {number} idUsuario 
     * @returns {Object|null} registro bruto ou null
     */
    static async readById(idUsuario) {
        const query = 'SELECT * FROM usuarios WHERE idUsuario = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idUsuario]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            return null;
        }
    }

    /**
     * Atualiza um usuário. Após update, busca nomeCargo atualizado.
     * @returns {boolean} true se atualizado, false caso contrário
     */
    async update() {
        const query = `
            UPDATE usuarios
            SET nomeUsuario = ?, emailUsuario = ?, senhaUsuario = MD5(?), dataCadastro = ?, idCargo = ?
            WHERE idUsuario = ?
        `;
        try {
            const conexao = Banco.getConexao();
            const values = [
                this.nomeUsuario,
                this.emailUsuario,
                this.senhaUsuario,
                this.dataCadastro,
                this.idCargo,
                this.idUsuario
            ];

            const [resposta] = await conexao.promise().execute(query, values);

            // Após alterar, buscar nome do cargo e atualizar this._nomeCargo
            const cargo = await Cargo.readById(this.idCargo);
            if (cargo) {
                this._nomeCargo = cargo.nomeCargo;
            }

            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return false;
        }
    }

    /**
     * Deleta um usuário pelo ID.
     * @returns {boolean} true se deletado, false caso contrário
     */
    async delete() {
        const query = 'DELETE FROM usuarios WHERE idUsuario = ?';
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [this.idUsuario]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            return false;
        }
    }

    /**
     * Faz login: verifica se existe usuário com o email e senha fornecidos.
     * Se encontrar, preenche todos os campos (inclusive nomeCargo) e retorna um objeto plano.
     * Se não encontrar, retorna null.
     * @returns {Object|null}
     */
    async login() {
        console.log("Usuario.login()");

        // Busca somente campos da tabela 'usuarios', sem nomeCargo
        const SQL = `
            SELECT
                idUsuario,
                nomeUsuario,
                emailUsuario,
                dataCadastro,
                idCargo
            FROM usuarios
            WHERE emailUsuario = ? AND senhaUsuario = MD5(?)
            LIMIT 1;
        `;

        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(SQL, [this.emailUsuario, this.senhaUsuario]);

            if (rows.length === 1) {
                const u = rows[0];
                this._idUsuario = u.idUsuario;
                this._nomeUsuario = u.nomeUsuario;
                this._emailUsuario = u.emailUsuario;
                this._dataCadastro = u.dataCadastro;
                this._idCargo = u.idCargo;

                // CONSULTAR NOME DO CARGO via modelo Cargo
                const cargo = await Cargo.readById(this.idCargo);
                if (cargo) {
                    this._nomeCargo = cargo.nomeCargo;
                }

                // Retorna um objeto plano contendo todas as infos, incluindo nomeCargo
                return {
                    idUsuario: this.idUsuario,
                    nomeUsuario: this.nomeUsuario,
                    emailUsuario: this.emailUsuario,
                    dataCadastro: this.dataCadastro,
                    idCargo: this.idCargo,
                    nomeCargo: this.nomeCargo
                };
            }

            return null;
        } catch (error) {
            console.error("Erro em Usuario.login():", error);
            return null;
        }
    }

    /**
     * Verifica se existe um usuário com o ID fornecido.
     * @param {number} idUsuario 
     * @returns {boolean}
     */
    static async isUsuario(idUsuario) {
        const query = 'SELECT COUNT(*) as qtd FROM usuarios WHERE idUsuario = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idUsuario]);
            return rows[0].qtd > 0;
        } catch (error) {
            console.error('Erro ao verificar se o usuário existe:', error);
            return false;
        }
    }

    /**
     * Busca todos os usuários com um determinado idCargo. 
     * (Preenche apenas idCargo em cada instância; se quiser nomeCargo, pode iterar e chamar Cargo.readById em cada um).
     * @param {number} idCargo 
     * @returns {Array<Usuario>}
     */
    static async findByCargoId(idCargo) {
        const query = 'SELECT * FROM usuarios WHERE idCargo = ?';
        try {
            const conexao = Banco.getConexao();
            const [rows] = await conexao.promise().execute(query, [idCargo]);

            return rows.map(r => {
                const u = new Usuario();
                u.idUsuario = r.idUsuario;
                u.nomeUsuario = r.nomeUsuario;
                u.emailUsuario = r.emailUsuario;
                u.senhaUsuario = r.senhaUsuario;
                u.dataCadastro = r.dataCadastro;
                u.idCargo = r.idCargo;
                // Não preenche nomeCargo aqui, mas poderia chamar Cargo.readById
                return u;
            });
        } catch (error) {
            console.error('Erro ao buscar usuários por cargo:', error);
            return [];
        }
    }

    // ==========================
    // Getters e Setters
    // ==========================
    get idUsuario() {
        return this._idUsuario;
    }
    set idUsuario(valor) {
        this._idUsuario = valor;
    }

    get nomeUsuario() {
        return this._nomeUsuario;
    }
    set nomeUsuario(valor) {
        this._nomeUsuario = valor;
    }

    get emailUsuario() {
        return this._emailUsuario;
    }
    set emailUsuario(valor) {
        this._emailUsuario = valor;
    }

    get senhaUsuario() {
        return this._senhaUsuario;
    }
    set senhaUsuario(valor) {
        this._senhaUsuario = valor;
    }

    get dataCadastro() {
        return this._dataCadastro;
    }
    set dataCadastro(valor) {
        this._dataCadastro = valor;
    }

    get idCargo() {
        return this._idCargo;
    }
    set idCargo(valor) {
        this._idCargo = valor;
    }

    get nomeCargo() {
        return this._nomeCargo;
    }
    set nomeCargo(valor) {
        this._nomeCargo = valor;
    }
};
