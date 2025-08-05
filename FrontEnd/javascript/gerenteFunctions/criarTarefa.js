// Seleção de elementos do DOM
const formCriar = document.getElementById("formCriarTarefa");
const txtTitulo = document.getElementById("txtTituloTarefa");
const txtDescricao = document.getElementById("txtDescricaoTarefa");
const txtStatus = document.getElementById("txtStatusTarefa");
const txtDataInicio = document.getElementById("txtDataInicio");
const txtDataFim = document.getElementById("txtDataFim");
const txtValorOpc = document.getElementById("txtValorOpc");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function(event) {
    event.preventDefault();

    esconderRespostaPopup();

    // Coleta e validação dos campos
    const titulo = txtTitulo.value.trim();
    const descricao = txtDescricao.value.trim();
    const status = txtStatus.value.trim();
    const dataInicio = txtDataInicio.value;
    const dataFim = txtDataFim.value;
    const valorOpc = parseFloat(txtValorOpc.value);

    if (titulo.length === 0) {
        mostrarRespostaPopup("Título da tarefa obrigatório.", false);
        return;
    }
    if (descricao.length === 0) {
        mostrarRespostaPopup("Descrição da tarefa obrigatória.", false);
        return;
    }
    if (status.length === 0) {
        mostrarRespostaPopup("Status da tarefa obrigatório.", false);
        return;
    }
    if (!dataInicio) {
        mostrarRespostaPopup("Data de início obrigatória.", false);
        return;
    }
    if (!dataFim) {
        mostrarRespostaPopup("Data de fim obrigatória.", false);
        return;
    }
    if (isNaN(valorOpc)) {
        mostrarRespostaPopup("Valor opcional inválido.", false);
        return;
    }

    const objTarefa = {
        tituloTarefa: titulo,
        descricaoTarefa: descricao,
        statusTarefa: status,
        dataInicio: dataInicio,
        dataFim: dataFim,
        valorOpc: valorOpc
    };

    fetch_post_criarTarefa("http://localhost:3000/tarefas", objTarefa);
});

function fetch_post_criarTarefa(URI, obj) {
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
            mostrarRespostaPopup(data.message, true);
            formCriar.reset();
        } else {
            const msgErro = data.message || "Erro desconhecido ao criar tarefa.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        console.error("Erro inesperado:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

// Funções de popup (iguais às dos arquivos originais)
function mostrarRespostaPopup(mensagem, sucesso = false) {
    divResposta.innerText = mensagem;
    divResposta.classList.remove("sucesso", "erro");
    if (sucesso) {
        divResposta.classList.add("sucesso");
    } else {
        divResposta.classList.add("erro");
    }
    divResposta.style.display = "block";
    setTimeout(() => {
        esconderRespostaPopup();
    }, 5000);
}

function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso", "erro");
}