const MeuTokenJWT = require("../models/MeuTokenJWT");

module.exports = class JwtMiddleware {
    validar_token_acesso = (request, response, next) => {
        const authorization = request.headers.authorization;
        console.log("🚀 Token recebido:", authorization); // 👈 Loga o que chegou

        const jwt = new MeuTokenJWT();
        const autorizado = jwt.validarToken(authorization);

        console.log("🔐 Token autorizado?", autorizado);
        console.log("📦 Payload:", jwt.payload);

        console.log("autorizado:", autorizado);

        if (autorizado === true) {
            request.user = jwt.payload;
            next();
        } else {
            const objResposta = {
                status: false,
                msg: "Token inválido ou expirado"
            };
            response.status(401).send(objResposta);
        }
    }
}
