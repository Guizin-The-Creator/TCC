const Cargo = require('../models/Cargo');
const Banco = require('../models/Banco');
const Usuario = require('../models/Usuario'); // certifique-se de ter esse model

module.exports = class CargoMiddleware {
    validar_nomeCargo = (req, res, next) => {
        const nome = req.body.nomeCargo;

        if (!nome || typeof nome !== 'string') {
            const objetoResposta = {
                status: false,
                error: 'O nome do cargo deve ser uma string válida.'
            }
            return res.status(400).send(objetoResposta);
        }

        const nomeLimpo = nome.trim();

        if (nomeLimpo.length < 3 || nomeLimpo.length > 50) {
            const objetoResposta = {
                status: false,
                error: 'O nome do cargo deve ter entre 3 e 50 caracteres.'
            }
            return res.status(400).send(objetoResposta);
        }

        if (!/^[A-Za-zÀ-ÿ\s]+$/.test(nomeLimpo)) {
            const objetoResposta = {
                status: false,
                error: 'O nome do cargo deve conter apenas letras e espaços.'
            }
            return res.status(400).send(objetoResposta);
        }

        next();
    }

    validar_prioridadeCargo = (req, res, next) => {
        const prioridade = req.body.prioridadeCargo;

        if (prioridade === undefined || prioridade === null || prioridade === '') {
            const objetoResposta = {
                status: false,
                error: 'A prioridade do cargo é obrigatória.'
            }
            return res.status(400).send(objetoResposta);
        }

        if (isNaN(prioridade)) {
            const objetoResposta = {
                status: false,
                error: 'A prioridade do cargo deve ser um número.'
            }
            return res.status(400).send(objetoResposta);
        }

        const numero = Number(prioridade);

        if (!Number.isInteger(numero)) {
            const objetoResposta = {
                status: false,
                error: 'A prioridade deve ser um número inteiro.'
            }
            return res.status(400).send(objetoResposta);
        }

        if (numero < 0 || numero > 10) {
            const objetoResposta = {
                status: false,
                error: 'A prioridade deve estar entre 0 e 10.'
            }
            return res.status(400).send(objetoResposta);
        }

        next();
    }

    validar_nomeCargoDuplicado = async (req, res, next) => {
        const nome = req.body.nomeCargo.trim();
        const id = req.params.id; // caso esteja atualizando

        const cargoExistente = await Cargo.findByNome(nome);

        if (cargoExistente && cargoExistente.idCargo != id) {
            const objetoResposta = {
                status: false,
                error: 'Já existe um cargo com esse nome.'
            }
            return res.status(409).send(objetoResposta);
        }

        next();
    }

    validar_cargoSemUsuariosVinculados = async (req, res, next) => {
        const idCargo = req.params.id;

        try {
            const usuarios = await Usuario.findByCargoId(idCargo);
            if (usuarios.length > 0) {
                const objetoResposta = {
                    status: false,
                    error: 'Não é possível excluir este cargo porque há usuários vinculados a ele.'
                }
                return res.status(400).send(objetoResposta);
            }

            next();
        } catch (erro) {
            console.error('Erro ao verificar vínculos de cargo com usuários:', erro);
            const objetoResposta = {
                status: false,
                error: 'Erro interno ao verificar vínculos de usuários.'
            }
            return res.status(500).send(objetoResposta);
        }
    }
}

