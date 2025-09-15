// models/MeuTokenJWT.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

module.exports = class MeuTokenJWT {
    constructor() {
        this._key = process.env.JWT_SECRET || "x9S4q0v+V0IjvHkG20uAxaHx1ijj+q1HWjHKv+ohxp/oK+77qyXkVj/l4QYHHTF3";
        this._alg = 'HS256';
        this._type = 'JWT';
        this._iss = 'http://localhost';
        this._aud = 'http://localhost';
        this._sub = 'acesso_sistema';
        this._duracaoToken = 3600 * 24 * 30; // 30 dias
        this.payload = null;
    }

    /**
     * Gera um token JWT com as claims completas do usuário,
     * incluindo agora idCargo e nomeCargo.
     * @param {object} parametrosClaims – deve conter { idUsuario, emailUsuario, nomeUsuario, dataCadastro, idCargo, nomeCargo }
     * @returns {string} token JWT
     */
    gerarToken = (parametrosClaims) => {
        const headers = { alg: this._alg, typ: this._type };
        const payload = {
            iss: this._iss,
            aud: this._aud,
            sub: this._sub,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this._duracaoToken,
            nbf: Math.floor(Date.now() / 1000),
            jti: crypto.randomBytes(16).toString('hex'),
            idUsuario: parametrosClaims.idUsuario,
            emailUsuario: parametrosClaims.emailUsuario,
            nomeUsuario: parametrosClaims.nomeUsuario,
            dataCadastro: parametrosClaims.dataCadastro,
            idCargo: parametrosClaims.idCargo,
            nomeCargo: parametrosClaims.nomeCargo   
        };

        return jwt.sign(payload, this._key, {
            algorithm: this._alg,
            header: headers
        });
    }

    /**
     * Valida um token JWT e armazena as claims em this.payload
     * @param {string} stringToken – 'Bearer <token>' ou '<token>'
     * @returns {boolean}
     */
    validarToken = (stringToken) => {
        if (!stringToken || typeof stringToken !== 'string' || stringToken.trim() === '') {
            console.error('Token não fornecido ou inválido');
            return false;
        }

        const token = stringToken.replace(/^Bearer\s+/i, '').trim();
        try {
            const decoded = jwt.verify(token, this._key, { algorithms: [this._alg] });
            this.payload = decoded;
            return true;
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                console.error('Token expirado');
            } else if (err instanceof jwt.JsonWebTokenError) {
                console.error('Token inválido');
            } else {
                console.error('Erro ao validar token:', err);
            }
            return false;
        }
    }

    // ==========================
    // Getters e Setters
    // ==========================
    get key() {
        return this._key;
    }
    set key(v) {
        this._key = v;
    }

    get alg() {
        return this._alg;
    }
    set alg(v) {
        this._alg = v;
    }

    get type() {
        return this._type;
    }
    set type(v) {
        this._type = v;
    }

    get iss() {
        return this._iss;
    }
    set iss(v) {
        this._iss = v;
    }

    get aud() {
        return this._aud;
    }
    set aud(v) {
        this._aud = v;
    }

    get sub() {
        return this._sub;
    }
    set sub(v) {
        this._sub = v;
    }

    get duracaoToken() {
        return this._duracaoToken;
    }
    set duracaoToken(v) {
        this._duracaoToken = v;
    }
};
