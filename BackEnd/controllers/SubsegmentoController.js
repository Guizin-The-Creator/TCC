const Subsegmento = require('../models/Subsegmento');

module.exports = class SubsegmentoController {

    // Listar todos os subsegmentos
    Subsegmento_readAll_controller = async (req, res) => {
        try {
            const subsegmentos = await Subsegmento.readAll();

            if (subsegmentos.length > 0) {
                res.status(200).send({
                    status: true,
                    message: 'Subsegmentos encontrados com sucesso',
                    data: subsegmentos
                });
            } else {
                res.status(404).send({
                    status: false,
                    message: 'Nenhum subsegmento encontrado'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar subsegmentos:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar subsegmentos'
            });
        }
    }

    // Buscar subsegmentos de um segmento específico
    Subsegmento_readBySegmento_controller = async (req, res) => {
        const idSegmento = req.params.idSegmento;
        try {
            const subsegmentos = await Subsegmento.readBySegmento(idSegmento);

            if (subsegmentos.length > 0) {
                res.status(200).send({
                    status: true,
                    message: 'Subsegmentos do segmento encontrados com sucesso',
                    data: subsegmentos
                });
            } else {
                res.status(404).send({
                    status: false,
                    message: 'Nenhum subsegmento encontrado para este segmento'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar subsegmentos por segmento:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar subsegmentos por segmento'
            });
        }
    }

    // Buscar um subsegmento pelo ID
    Subsegmento_readById_controller = async (req, res) => {
        const idSubsegmento = req.params.idSubsegmento;
        try {
            const subsegmentos = await Subsegmento.readById(idSubsegmento);

            if (subsegmentos) {
                res.status(200).send({
                    status: true,
                    message: 'Subsegmento encontrado com sucesso',
                    data: subsegmentos
                });
            } else {
                res.status(404).send({
                    status: false,
                    message: 'Subsegmento não encontrado'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar subsegmento:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar subsegmento'
            });
        }
    }
};
