const Banco = require('./Banco');

module.exports = class UsuarioTarefa {
    constructor() {
        this.idUsuario = null;
        this.idTarefa = null;
        this.status = null; // Status da associação
    }

    // Cria uma nova associação usuário-tarefa
    async create() {
        const query = "INSERT INTO usuarios_tarefas (usuarios_idUsuario, tarefas_idTarefa, status) VALUES (?, ?, ?)";
        try {
            const conexao = Banco.getConexao();
            const values = [this.idUsuario, this.idTarefa, this.status];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao criar associação usuário-tarefa:', error);
            return false;
        }
    }

    // Atualiza o status da associação usuário-tarefa
    async update() {
        const query = 'UPDATE usuarios_tarefas SET status = ? WHERE usuarios_idUsuario = ? AND tarefas_idTarefa = ?';
        try {
            const conexao = Banco.getConexao();
            const values = [this.status, this.idUsuario, this.idTarefa];
            const [resposta] = await conexao.promise().execute(query, values);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao atualizar associação usuário-tarefa:', error);
            return false;
        }
    }

    // Retorna todas as associações
    static async readAll() {
        const query = "SELECT * FROM usuarios_tarefas";
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query);
            return resposta;
        } catch (error) {
            console.error('Erro ao buscar todas as associações usuário-tarefa:', error);
            return [];
        }
    }

    // Retorna todas as tarefas associadas a um único usuário
    static async readByUserId(idUsuario) {
        const query = "SELECT * FROM usuarios_tarefas WHERE usuarios_idUsuario = ?";
        try {
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idUsuario]);
            return resposta;
        } catch (error) {
            console.error('Erro ao buscar associações por usuário:', error);
            return [];
        }
    }

        // Retorna todas as associações de uma tarefa específica
        static async readByTarefa(idTarefa) {
            const query = "SELECT * FROM usuarios_tarefas WHERE tarefas_idTarefa = ?";
            try {
                const conexao = Banco.getConexao();
                const [resposta] = await conexao.promise().execute(query, [idTarefa]);
                return resposta;
            } catch (error) {
                console.error('Erro ao buscar associações por tarefa:', error);
                return [];
            }
        }
    
        // Atualiza o status para todas as associações da tarefa
        static async updateByTarefa(idTarefa, status) {
            const query = 'UPDATE usuarios_tarefas SET status = ? WHERE tarefas_idTarefa = ?';
            try {
                const conexao = Banco.getConexao();
                const [resposta] = await conexao.promise().execute(query, [status, idTarefa]);
                return resposta.affectedRows > 0;
            } catch (error) {
                console.error('Erro ao atualizar associações por tarefa:', error);
                return false;
            }
        }
    


    // Remove uma associação usuário-tarefa
    static async delete(idUsuario, idTarefa) {
        try {
            const query = "DELETE FROM usuarios_tarefas WHERE usuarios_idUsuario = ? AND tarefas_idTarefa = ?";
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idUsuario, idTarefa]);
            return resposta.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao remover associação usuário-tarefa:', error);
            return false;
        }
    }

    // Verifica se uma associação já existe
    static async isAssociacao(idUsuario, idTarefa) {
        try {
            const query = "SELECT COUNT(*) as qtd FROM usuarios_tarefas WHERE usuarios_idUsuario = ? AND tarefas_idTarefa = ?";
            const conexao = Banco.getConexao();
            const [resposta] = await conexao.promise().execute(query, [idUsuario, idTarefa]);
            return resposta[0].qtd > 0;
        } catch (error) {
            console.error('Erro ao verificar associação usuário-tarefa:', error);
            throw error;
        }
    }

    // Getters e Setters
    get getIdUsuario() {
        return this.idUsuario;
    }

    set setIdUsuario(idUsuario) {
        this.idUsuario = idUsuario;
    }

    get getIdTarefa() {
        return this.idTarefa;
    }

    set setIdTarefa(idTarefa) {
        this.idTarefa = idTarefa;
    }

    get getStatus() {
        return this.status;
    }

    set setStatus(status) {
        this.status = status;
    }
}
