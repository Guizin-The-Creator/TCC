const tabelaCargos = document.getElementById("tabelaCargos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

// Dispara busca ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
    buscarTodosCargos();
});

function buscarTodosCargos() {
    const URI = "http://localhost:3000/cargos"; // endpoint GET /cargos

    const token = localStorage.getItem("token");

    fetch(URI, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    })
    .then(async response => {
        const data = await response.json();

        console.log("Resposta completa do servidor (GET /cargos):", data);
        console.log("Status HTTP:", response.status);

        if (response.ok && data.status === true) {
            preencherTabela(data.data);
        } else {
            const msg = data.message || "Erro ao obter cargos.";
            mostrarRespostaPopup(msg);
        }
    })
    .catch(error => {
        console.error("Erro inesperado ao buscar cargos:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message);
    });
}

function preencherTabela(listaCargos) {
    tabelaCargos.innerHTML = "";

    if (!Array.isArray(listaCargos) || listaCargos.length === 0) {
        mostrarRespostaPopup("Nenhum cargo encontrado.", "#FFA726");
        return;
    }

    listaCargos.forEach(cargo => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.innerText = cargo.idCargo;
        tr.appendChild(tdId);

        const tdNome = document.createElement("td");
        tdNome.innerText = cargo.nomeCargo;
        tr.appendChild(tdNome);

        const tdPrioridade = document.createElement("td");
        tdPrioridade.innerText = cargo.prioridadeCargo;
        tr.appendChild(tdPrioridade);

        tabelaCargos.appendChild(tr);
    });
}

function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
    divResposta.innerText = mensagem;
    divResposta.style.backgroundColor = corFundo;
    divResposta.style.display = "block";

    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
