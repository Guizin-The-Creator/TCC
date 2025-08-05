const Tarefa = require('../models/Tarefa');
const MeuTokenJWT = require('../models/MeuTokenJWT');

module.exports = class TarefaController {
    Tarefa_create_controller = async (req, res) => {
        const tarefa = new Tarefa();
        tarefa.tituloTarefa = req.body.tituloTarefa;
        tarefa.descricaoTarefa = req.body.descricaoTarefa;
        tarefa.prioridadeTarefa = req.body.prioridadeTarefa;  // novo
        tarefa.dataInicio = req.body.dataInicio;
        tarefa.dataFim = req.body.dataFim;
        tarefa.valorOpc = req.body.valorOpc;

        const sucesso = await tarefa.create();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(201).send({
                status: true,
                message: 'Tarefa criada com sucesso',
                tarefa,
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao criar tarefa',
            token
        });
    }

    Tarefa_readAll_controller = async (req, res) => {
        const tarefas = await Tarefa.readAll();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        return res.status(200).send({
            status: true,
            message: 'Tarefas encontradas com sucesso',
            tarefas,
            token
        });
    }

    Tarefa_readById_controller = async (req, res) => {
        const id = req.params.id;
        const tarefa = await Tarefa.readById(id);
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (tarefa) {
            return res.status(200).send({
                status: true,
                message: 'Tarefa encontrada com sucesso',
                tarefa,
                token
            });
        }
        return res.status(404).send({
            status: false,
            message: 'Tarefa não encontrada',
            token
        });
    }

    Tarefa_update_controller = async (req, res) => {
        const tarefa = new Tarefa();
        tarefa.idTarefa = req.params.id;
        tarefa.tituloTarefa = req.body.tituloTarefa;
        tarefa.descricaoTarefa = req.body.descricaoTarefa;
        tarefa.prioridadeTarefa = req.body.prioridadeTarefa;  // novo
        tarefa.dataInicio = req.body.dataInicio;
        tarefa.dataFim = req.body.dataFim;
        tarefa.valorOpc = req.body.valorOpc;

        const sucesso = await tarefa.update();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Tarefa atualizada com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao atualizar tarefa',
            token
        });
    }

    Tarefa_delete_controller = async (req, res) => {
        const tarefa = new Tarefa();
        tarefa.idTarefa = req.params.id;

        const sucesso = await tarefa.delete();
        const jwt = new MeuTokenJWT();
        const token = jwt.gerarToken(req.user);

        if (sucesso) {
            return res.status(200).send({
                status: true,
                message: 'Tarefa deletada com sucesso',
                token
            });
        }
        return res.status(500).send({
            status: false,
            message: 'Erro ao deletar tarefa',
            token
        });
    }
};
