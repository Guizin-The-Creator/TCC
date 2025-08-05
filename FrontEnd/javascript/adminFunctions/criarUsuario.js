// Seleção de elementos do DOM
const formCriar = document.getElementById("formCriarUsuario");
const txtNome = document.getElementById("txtNome");
const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const txtDataCadastro = document.getElementById("txtDataCadastro");
const txtIdCargo = document.getElementById("txtIdCargo");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(event) {
    event.preventDefault(); // evita reload da página

    // Limpar qualquer mensagem anterior
    esconderRespostaPopup();

    // Coleta e validação básica dos campos
    const nome = txtNome.value.trim();
    const email = txtEmail.value.trim();
    const senha = txtSenha.value.trim();
    const dataCadastro = txtDataCadastro.value; // no formato yyyy-mm-dd
    const idCargo = parseInt(txtIdCargo.value);

    if (nome.length === 0) {
        mostrarRespostaPopup("Nome obrigatório.", false);
        return;
    }
    if (!email.includes("@")) {
        mostrarRespostaPopup("E-mail inválido.", false);
        return;
    }
    if (senha.length < 6) {
        mostrarRespostaPopup("Senha deve ter pelo menos 6 caracteres.", false);
        return;
    }
    if (!dataCadastro) {
        mostrarRespostaPopup("Data de cadastro obrigatória.", false);
        return;
    }
    if (isNaN(idCargo) || idCargo < 1) {
        mostrarRespostaPopup("ID Cargo inválido.", false);
        return;
    }

    // Monta o objeto que iremos enviar
    const objUsuario = {
        nomeUsuario: nome,
        emailUsuario: email,
        senhaUsuario: senha,
        dataCadastro: dataCadastro,
        idCargo: idCargo
    };

    // Chama a função que faz o POST
    fetch_post_criarUsuario("http://localhost:3000/usuarios", objUsuario);
});

function fetch_post_criarUsuario(URI, obj) {
    const textoJson = JSON.stringify(obj);

    fetch(URI, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: textoJson
    })
    .then(async response => {
        const data = await response.json();

        console.log("Resposta completa do servidor:", data);
        console.log("Status HTTP:", response.status);

        if (response.ok && data.status === true) {
            // Usuário criado com sucesso
            mostrarRespostaPopup(data.message, true);

            // Se a API retornar token (caso queira logar automaticamente, por exemplo):
            if (data.token) {
                localStorage.setItem("token", data.token);
            }

            // Limpar formulário após  sucesso
            formCriar.reset();
        } else {
            // Em caso de erro (status false ou status HTTP não ok)
            const msgErro = data.message || "Erro desconhecido ao criar usuário.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        console.error("Erro inesperado:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

// Função para exibir popup: sucesso = true → verde; false → vermelho
function mostrarRespostaPopup(mensagem, sucesso = false) {
    divResposta.innerText = mensagem;
    divResposta.classList.remove("sucesso", "erro");

    if (sucesso) {
        divResposta.classList.add("sucesso");
    } else {
        divResposta.classList.add("erro");
    }

    divResposta.style.display = "block";

    // Após 5 segundos, esconde novamente
    setTimeout(() => {
        esconderRespostaPopup();
    }, 5000);
}

function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso", "erro");
}
