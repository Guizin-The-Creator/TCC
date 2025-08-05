const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const btnLogin = document.getElementById("btnLogin");
const divResposta = document.getElementById("divResposta"); // Certifique-se que este elemento existe no seu HTML de login

btnLogin.onclick = onclick_btnLogin;

function onclick_btnLogin(event) {
    event.preventDefault();

    const URI = "http://localhost:3000/usuarios/login";

    const email = txtEmail.value.trim();
    if (!email.includes("@")) {
        mostrarRespostaPopup("Email inválido.");
        return;
    }

    const senha = txtSenha.value.trim();
    if (senha.length === 0) {
        mostrarRespostaPopup("Senha não pode estar vazia.");
        return;
    }

    const obj = {
        emailUsuario: email,
        senhaUsuario: senha
    };

    fetch_post_verificarlogin(URI, obj);
}

function fetch_post_verificarlogin(URI, obj) {
    const textoJson = JSON.stringify(obj);

    fetch(URI, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        body: textoJson
    })
        .then(async response => {
            const data = await response.json();

            console.log("Resposta completa do servidor:", data);
            console.log("Status HTTP:", response.status);

            if (response.ok) {
                mostrarRespostaPopup(data.message, "#4CAF50");

                if (data.status === true && data.token) {
                    // 1) Armazena o token
                    localStorage.setItem("token", data.token);

                    // 2) Decodifica o token para extrair nomeCargo
                    const payload = parseJwt(data.token);
                    console.log("Payload do token:", payload);

                    const nomeCargo = payload.nomeCargo;
                    if (!nomeCargo) {
                        mostrarRespostaPopup("nomeCargo não encontrado no token!");
                        return;
                    }

                    console.log("Nome do Cargo (JWT):", nomeCargo);

                    // 3) Redirecionamento com base no nomeCargo
                    const cargo = nomeCargo.toLowerCase();
                    if (cargo.includes("administrador do sistema")) {
                        window.location.href = "../html/adminFunctions/adm.html";
                    } else if (cargo.includes("gerente") && !cargo.includes("financeiro")) { // Adicionado para evitar conflito com "gerente financeiro"
                        window.location.href = "../html/gerenteFunctions/gerente.html";
                    } else if (cargo.includes("funcionario") && !cargo.includes("financeiro")) { // Adicionado para evitar conflito com "funcionario financeiro"
                        window.location.href = "../html/funcionario/funcionario.html";
                    } else if (cargo.includes("funcionario financeiro")) {
                        window.location.href = "../html/funcionarioFinanceiroFunctions/funcionarioFinanceiro.html";
                    } else if (cargo.includes("gerente financeiro")) {
                        window.location.href = "../html/gerenteFinanceiroFunctions/gerenteFinanceiro.html";
                    }
                    else {
                        mostrarRespostaPopup("Cargo não reconhecido: " + nomeCargo);
                    }
                }
            } else {
                mostrarRespostaPopup(data.message || "Erro desconhecido");
            }
        })
        .catch(error => {
            console.error("Erro inesperado:", error);
            mostrarRespostaPopup("Erro inesperado: " + error.message);
        });
}

// Função auxiliar para decodificar JWT
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
    );

    return JSON.parse(jsonPayload);
}

// Função para exibir mensagens de feedback (certifique-se que o elemento divResposta existe no seu HTML)
function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
    if (divResposta) { // Verifica se o elemento divResposta existe antes de tentar manipulá-lo
        divResposta.innerText = mensagem;
        divResposta.style.backgroundColor = corFundo;
        divResposta.style.display = "block";

        setTimeout(() => {
            divResposta.style.display = "none";
        }, 5000);
    } else {
        console.warn("Elemento 'divResposta' não encontrado. Mensagem: " + mensagem);
        alert(mensagem); // Fallback para alert se o elemento não existir
    }
}