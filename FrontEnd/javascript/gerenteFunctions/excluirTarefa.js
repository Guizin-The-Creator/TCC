// Elementos do DOM
const tabelaTarefasBody = document.getElementById("tabelaTarefas").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodasTarefas();
});

function buscarTodasTarefas() {
    const URI = "http://localhost:3000/tarefas";

    fetch(URI, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async response => {
        const data = await response.json();
        console.log("GET /tarefas →", data);

        if (response.ok && data.status === true) {
            preencherTabela(data.tarefas);
        } else {
            const msgErro = data.message || "Erro ao listar tarefas.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        console.error("Erro ao buscar tarefas:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

function preencherTabela(listaTarefas) {
    tabelaTarefasBody.innerHTML = "";

    if (!Array.isArray(listaTarefas) || listaTarefas.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.setAttribute("colspan", "8");
        td.style.textAlign = "center";
        td.innerText = "Nenhuma tarefa encontrada.";
        tr.appendChild(td);
        tabelaTarefasBody.appendChild(tr);
        return;
    }

    listaTarefas.forEach(tarefa => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.innerText = tarefa.idTarefa;
        tr.appendChild(tdId);

        const tdTitulo = document.createElement("td");
        tdTitulo.innerText = tarefa.tituloTarefa;
        tr.appendChild(tdTitulo);

        const tdDescricao = document.createElement("td");
        tdDescricao.innerText = tarefa.descricaoTarefa;
        tr.appendChild(tdDescricao);

        const tdStatus = document.createElement("td");
        tdStatus.innerText = tarefa.statusTarefa;
        tr.appendChild(tdStatus);

        const tdDataInicio = document.createElement("td");
        tdDataInicio.innerText = tarefa.dataInicio ? formatarData(tarefa.dataInicio) : "-";
        tr.appendChild(tdDataInicio);

        const tdDataFim = document.createElement("td");
        tdDataFim.innerText = tarefa.dataFim ? formatarData(tarefa.dataFim) : "-";
        tr.appendChild(tdDataFim);

        const tdValorOpc = document.createElement("td");
        tdValorOpc.innerText = tarefa.valorOpc ? parseFloat(tarefa.valorOpc).toFixed(2) : "0.00";
        tr.appendChild(tdValorOpc);

        const tdAcoes = document.createElement("td");
        const btnExcluir = document.createElement("button");
        btnExcluir.innerText = "Excluir";
        btnExcluir.classList.add("btnExcluir");
        btnExcluir.addEventListener("click", () => {
            confirmarEExcluir(tarefa.idTarefa);
        });
        tdAcoes.appendChild(btnExcluir);
        tr.appendChild(tdAcoes);

        tabelaTarefasBody.appendChild(tr);
    });
}

function confirmarEExcluir(idTarefa) {
    const confirmacao = window.confirm(`Deseja realmente excluir a tarefa de ID ${idTarefa}?`);
    if (!confirmacao) {
        return;
    }
    fetchDeleteTarefa(`http://localhost:3000/tarefas/${idTarefa}`);
}

function fetchDeleteTarefa(URI) {
    fetch(URI, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async response => {
        const data = await response.json();
        console.log("DELETE /tarefas/:id →", data);

        if (response.ok && data.status === true) {
            mostrarRespostaPopup(data.message, true);
            buscarTodasTarefas();
        } else {
            const msgErro = data.message || "Falha ao excluir tarefa.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        console.error("Erro inesperado ao excluir:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

// Funções auxiliares (iguais às dos arquivos originais)
function formatarData(dataISO) {
    try {
        const d = new Date(dataISO);
        const dia = String(d.getDate()).padStart(2, "0");
        const mes = String(d.getMonth() + 1).padStart(2, "0");
        const ano = d.getFullYear();
        const hora = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dia}/${mes}/${ano} ${hora}:${min}`;
    } catch {
        return dataISO;
    }
}

function mostrarRespostaPopup(mensagem, sucesso = false) {
    divResposta.innerText = mensagem;
    divResposta.classList.remove("sucesso", "erro");
    divResposta.classList.add(sucesso ? "sucesso" : "erro");
    divResposta.style.display = "block";
    setTimeout(() => {
        esconderRespostaPopup();
    }, 5000);
}

function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso", "erro");
}