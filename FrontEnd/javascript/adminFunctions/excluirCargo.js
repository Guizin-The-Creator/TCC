// Elementos do DOM
const tabelaCargosBody = document
    .getElementById("tabelaCargos")
    .getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

// Ao carregar a página, busca todos os cargos
window.addEventListener("DOMContentLoaded", () => {
    buscarTodosCargos();
});

/**
 * Faz um GET /cargos e preenche a tabela com os dados.
 */
function buscarTodosCargos() {
    const URI = "http://localhost:3000/cargos";

    fetch(URI, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
        .then(async response => {
            const data = await response.json();
            console.log("GET /cargos →", data);

            if (response.ok && data.status === true) {
                preencherTabela(data.data);
            } else {
                const msgErro = data.message || "Erro ao listar cargos.";
                mostrarRespostaPopup(msgErro, false);
            }
        })
        .catch(error => {
            console.error("Erro ao buscar cargos:", error);
            mostrarRespostaPopup("Erro inesperado: " + error.message, false);
        });
}

/**
 * Recebe um array de cargos e insere linhas na tabela.
 * Cada linha terá um botão “Excluir” que chama confirmarEExcluir(id).
 */
function preencherTabela(listaCargos) {
    // Limpa conteúdo anterior
    tabelaCargosBody.innerHTML = "";

    if (!Array.isArray(listaCargos) || listaCargos.length === 0) {
        // Se nenhum cargo, exibe linha informativa
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.setAttribute("colspan", "3");
        td.style.textAlign = "center";
        td.innerText = "Nenhum cargo encontrado.";
        tr.appendChild(td);
        tabelaCargosBody.appendChild(tr);
        return;
    }

    listaCargos.forEach(cargo => {
        const tr = document.createElement("tr");

        // ID
        const tdId = document.createElement("td");
        tdId.innerText = cargo.idCargo;
        tr.appendChild(tdId);

        // Nome do Cargo
        const tdNome = document.createElement("td");
        tdNome.innerText = cargo.nomeCargo;
        tr.appendChild(tdNome);

        // Coluna Ações (botão Excluir)
        const tdAcoes = document.createElement("td");
        const btnExcluir = document.createElement("button");
        btnExcluir.innerText = "Excluir";
        btnExcluir.classList.add("btnExcluir");
        btnExcluir.addEventListener("click", () => {
            confirmarEExcluir(cargo.idCargo);
        });
        tdAcoes.appendChild(btnExcluir);
        tr.appendChild(tdAcoes);

        tabelaCargosBody.appendChild(tr);
    });
}

/**
 * Ao clicar em "Excluir", exibe um popup de confirmação (window.confirm).
 * Se confirmado, faz a chamada DELETE e exibe resposta.
 */
function confirmarEExcluir(idCargo) {
    const confirmacao = window.confirm(
        `Deseja realmente excluir o cargo de ID ${idCargo}?`
    );
    if (!confirmacao) {
        return; // cancelou
    }

    // Se confirmou, faz a requisição de exclusão
    fetchDeleteCargo(`http://localhost:3000/cargos/${idCargo}`);
}

/**
 * Faz o DELETE /cargos/:id e exibe um popup com o resultado
 */
function fetchDeleteCargo(URI) {
    fetch(URI, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
        .then(async response => {
            const data = await response.json();
            console.log("DELETE /cargos/:id →", data);

            if (response.ok && data.status === true) {
                mostrarRespostaPopup(data.message, true);
                buscarTodosCargos();
            } else {
                const msgErro = data.message || "Falha ao excluir cargo.";
                mostrarRespostaPopup(msgErro, false);
            }
        })
        .catch(error => {
            console.error("Erro inesperado ao excluir cargo:", error);
            mostrarRespostaPopup("Erro inesperado: " + error.message, false);
        });
}

/**
 * Exibe a divResposta com a mensagem e cor adequada.
 */
function mostrarRespostaPopup(mensagem, sucesso = false) {
    divResposta.innerText = mensagem;
    divResposta.classList.remove("sucesso", "erro");
    divResposta.classList.add(sucesso ? "sucesso" : "erro");
    divResposta.style.display = "block";

    setTimeout(() => {
        esconderRespostaPopup();
    }, 5000);
}

/**
 * Esconde a divResposta
 */
function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso", "erro");
}
