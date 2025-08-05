const UsuarioTarefa = require('../models/UsuarioTarefas');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class UsuarioTarefaController {
    // Criar associação
    UsuarioTarefa_create_controller = async (req, res) => {
        const usuarioTarefa = new UsuarioTarefa();
        usuarioTarefa.setIdUsuario = req.body.idUsuario;
        usuarioTarefa.setIdTarefa = req.body.idTarefa;
        usuarioTarefa.setStatus = req.body.status;

        const sucesso = await usuarioTarefa.create();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(201).send({
                status: true,
                message: 'Associação criada com sucesso',
                usuarioTarefa,
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao criar associação',
            token
        });
    };

    UsuarioTarefa_readAll_controller = async (req, res) => {
        const associacoes = await UsuarioTarefa.readAll();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        return res.status(200).send({
            status: true,
            message: 'Associações encontradas com sucesso',
            associacoes,
            token
        });
    }

    // NOVO: Buscar todas as tarefas associadas a um usuário específico
    UsuarioTarefa_readByUsuario_controller = async (req, res) => {
        const { idUsuario } = req.params;
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        try {
            const associacoes = await UsuarioTarefa.readByUserId(idUsuario);
            return res.status(200).send({
                status: true,
                message: "Associações do usuário encontradas com sucesso",
                associacoes,
                token
            });
        } catch (error) {
            return res.status(500).send({
                status: false,
                message: "Erro ao buscar associações do usuário",
                token
            });
        }
    };


    UsuarioTarefa_update_controller = async (req, res) => {
        const usuarioTarefa = new UsuarioTarefa();
        usuarioTarefa.setIdUsuario = req.body.idUsuario;
        usuarioTarefa.setIdTarefa = req.body.idTarefa;
        usuarioTarefa.setStatus = req.body.status;

        const sucesso = await usuarioTarefa.update();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Associação atualizada com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao atualizar associação',
            token
        });
    }

    UsuarioTarefa_delete_controller = async (req, res) => {
        const { idUsuario, idTarefa } = req.params;
        const sucesso = await UsuarioTarefa.delete(idUsuario, idTarefa);
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Associação deletada com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao deletar associação',
            token
        });
    }

    UsuarioTarefa_readById_controller = async (req, res) => {
        const { idUsuario, idTarefa } = req.params;
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        try {
            const associacao = await UsuarioTarefa.readById(idUsuario, idTarefa);
            if (associacao.length > 0) {
                return res.status(200).send({
                    status: true,
                    message: 'Associação encontrada com sucesso',
                    associacao,
                    token
                });
            } else {
                return res.status(404).send({
                    status: false,
                    message: 'Associação não encontrada',
                    token
                });
            }
        } catch (error) {
            return res.status(500).send({
                status: false,
                message: 'Erro ao buscar associação',
                token
            });
        }
    };

    UsuarioTarefa_isAssociacao_controller = async (req, res) => {
        const { idUsuario, idTarefa } = req.params;
        try {
            const existe = await UsuarioTarefa.isAssociacao(idUsuario, idTarefa);
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);

            return res.status(200).send({
                status: true,
                associacaoExiste: existe,
                token
            });
        } catch (error) {
            const jwt = new MeuTokenJWT();
            const token = jwt.gerarToken(req.user);
            return res.status(500).send({
                status: false,
                message: 'Erro ao verificar associação',
                token
            });
        }
    }
};
