module.exports = class TarefaMiddleware {
    
    validar_tituloTarefa = (request, response, next) => {
        const titulo = request.body.tituloTarefa;

        if (!titulo) {
            return response.status(400).send({
                status: false,
                error: 'O título da tarefa é obrigatório'
            });
        }

        if (titulo.trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'O título da tarefa não pode conter apenas espaços'
            });
        }

        if (titulo.length < 3) {
            return response.status(400).send({
                status: false,
                error: 'O título da tarefa deve ter no mínimo 3 caracteres'
            });
        }

        if (titulo.length > 100) {
            return response.status(400).send({
                status: false,
                error: 'O título da tarefa deve ter no máximo 100 caracteres'
            });
        }

        next();
    }

    validar_prioridadeTarefa = (request, response, next) => {
        const prioridade = request.body.prioridadeTarefa;
        const prioridadesValidas = ['Alta', 'Média', 'Baixa'];

        if (!prioridade) {
            return response.status(400).send({
                status: false,
                error: 'A prioridade da tarefa é obrigatória'
            });
        }

        if (!prioridadesValidas.includes(prioridade)) {
            return response.status(400).send({
                status: false,
                error: `Prioridade inválida. As prioridades válidas são: ${prioridadesValidas.join(', ')}`
            });
        }

        next();
    }

    validar_datas = (request, response, next) => {
        const { dataInicio, dataFim } = request.body;

        if (!dataInicio || !dataFim) {
            return response.status(400).send({
                status: false,
                error: 'Datas de início e fim são obrigatórias'
            });
        }

        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);

        if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
            return response.status(400).send({
                status: false,
                error: 'Formato de data inválido. Use YYYY-MM-DD'
            });
        }

        if (fim < inicio) {
            return response.status(400).send({
                status: false,
                error: 'A data de fim não pode ser anterior à data de início'
            });
        }

        next();
    }


    validar_descricaoTarefa = (request, response, next) => {
        const descricao = request.body.descricaoTarefa;

        if (!descricao || descricao.trim() === '') {
            return response.status(400).send({
                status: false,
                error: 'A descrição da tarefa é obrigatória'
            });
        }

        if (descricao.length < 10) {
            return response.status(400).send({
                status: false,
                error: 'A descrição deve ter no mínimo 10 caracteres'
            });
        }

        next();
    }
}
