module.exports = class UsuarioTarefaMiddleware {

  validar_ids(req, res, next) {
    const { idUsuario, idTarefa } = req.body;

    if (idUsuario == null || idTarefa == null) {
      return res.status(400).send({
        status: false,
        error: 'Os campos idUsuario e idTarefa são obrigatórios'
      });
    }

    const nUsuario = Number(idUsuario);
    const nTarefa = Number(idTarefa);

    if (!Number.isInteger(nUsuario) || nUsuario <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idUsuario deve ser um número inteiro positivo'
      });
    }

    if (!Number.isInteger(nTarefa) || nTarefa <= 0) {
      return res.status(400).send({
        status: false,
        error: 'idTarefa deve ser um número inteiro positivo'
      });
    }

    next();
  }

  validar_parametros_id(req, res, next) {
    const { idUsuario, idTarefa } = req.params;

    const nUsuario = Number(idUsuario);
    const nTarefa = Number(idTarefa);

    if (!Number.isInteger(nUsuario) || nUsuario <= 0) {
      return res.status(400).send({
        status: false,
        error: 'Parâmetro idUsuario inválido'
      });
    }

    if (!Number.isInteger(nTarefa) || nTarefa <= 0) {
      return res.status(400).send({
        status: false,
        error: 'Parâmetro idTarefa inválido'
      });
    }

    next();
  }
}
