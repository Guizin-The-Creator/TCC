const formCriar = document.getElementById("formCriarCargo");
const txtNomeCargo = document.getElementById("txtNomeCargo");
const txtPrioridadeCargo = document.getElementById("txtPrioridadeCargo");
const divResposta = document.getElementById("divResposta");

formCriar.addEventListener("submit", function (event) {
    event.preventDefault();

    esconderRespostaPopup();

    const nomeCargo = txtNomeCargo.value.trim();
    const prioridadeCargo = parseInt(txtPrioridadeCargo.value);

    if (nomeCargo.length === 0) {
        mostrarRespostaPopup("Nome do cargo obrigatório.", false);
        return;
    }

    if (isNaN(prioridadeCargo) || prioridadeCargo < 1) {
        mostrarRespostaPopup("Prioridade inválida. Use um número positivo.", false);
        return;
    }

    const objCargo = {
        nomeCargo: nomeCargo,
        prioridadeCargo: prioridadeCargo
    };

    fetch_post_criarCargo("http://localhost:3000/cargos", objCargo);
});

function fetch_post_criarCargo(URI, obj) {
    fetch(URI, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(obj)
    })
    .then(async response => {
        const data = await response.json();

        if (response.ok && data.status === true) {
            mostrarRespostaPopup(data.message, true);
            formCriar.reset();
        } else {
            const msgErro = data.message || "Erro ao criar o cargo.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

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
