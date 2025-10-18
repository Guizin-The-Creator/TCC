const Segmento = require('../models/Segmento');
const Subsegmento = require('../models/Subsegmento');

module.exports = class SegmentoController {

    Segmento_readAll_controller = async (req, res) => {
        try {
            const segmentos = await Segmento.readAll();
            if (segmentos.length > 0) {
                res.status(200).send({
                    status: true,
                    message: 'Segmentos encontrados com sucesso',
                    data: segmentos
                });
            } else {
                res.status(404).send({
                    status: false,
                    message: 'Nenhum segmento encontrado'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar segmentos:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar segmentos'
            });
        }
    }

    Segmento_readById_controller = async (req, res) => {
        try {
            const segmento = await Segmento.readById(req.params.id);
            if (segmento) {
                res.status(200).send({
                    status: true,
                    message: 'Segmento encontrado com sucesso',
                    data: segmento
                });
            } else {
                res.status(404).send({
                    status: false,
                    message: 'Segmento não encontrado'
                });
            }
        } catch (error) {
            console.error('Erro ao buscar segmento:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar segmento'
            });
        }
    }

    Subsegmento_readAll_controller = async (req, res) => {
        try {
            const subsegmentos = await Subsegmento.readAll();
            res.status(200).send({
                status: true,
                message: 'Subsegmentos encontrados com sucesso',
                data: subsegmentos
            });
        } catch (error) {
            console.error('Erro ao buscar subsegmentos:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar subsegmentos'
            });
        }
    }

    Subsegmento_readBySegmento_controller = async (req, res) => {
        try {
            const idSegmento = req.params.id;
            const subsegmentos = await Subsegmento.readBySegmento(idSegmento);
            res.status(200).send({
                status: true,
                message: 'Subsegmentos do segmento encontrados com sucesso',
                data: subsegmentos
            });
        } catch (error) {
            console.error('Erro ao buscar subsegmentos por segmento:', error);
            res.status(500).send({
                status: false,
                message: 'Erro interno ao buscar subsegmentos por segmento'
            });
        }
    }
};
