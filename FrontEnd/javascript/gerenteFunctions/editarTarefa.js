// Elementos do DOM
const tabelaTarefasBody = document.getElementById("tabelaTarefas").getElementsByTagName("tbody")[0];
const formEditarContainer = document.getElementById("formEditarContainer");
const formEditar = document.getElementById("formEditarTarefa");
const txtIdAtualizar = document.getElementById("txtIdAtualizar");
const txtTitulo = document.getElementById("txtTituloTarefa");
const txtDescricao = document.getElementById("txtDescricaoTarefa");
const txtStatus = document.getElementById("txtStatusTarefa");
const txtDataInicio = document.getElementById("txtDataInicio");
const txtDataFim = document.getElementById("txtDataFim");
const txtValorOpc = document.getElementById("txtValorOpc");
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
        td.setAttribute("colspan", "8"); // Aumenta o colspan para acomodar todos os campos + botão
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
        const btnSelecionar = document.createElement("button");
        btnSelecionar.innerText = "Selecionar";
        btnSelecionar.classList.add("btnSelecionar");
        btnSelecionar.addEventListener("click", () => {
            carregarFormulario(tarefa);
        });
        tdAcoes.appendChild(btnSelecionar);
        tr.appendChild(tdAcoes);

        tabelaTarefasBody.appendChild(tr);
    });
}

function carregarFormulario(tarefa) {
    formEditarContainer.classList.remove("oculto");

    txtIdAtualizar.value = tarefa.idTarefa;
    txtTitulo.value = tarefa.tituloTarefa;
    txtDescricao.value = tarefa.descricaoTarefa;
    txtStatus.value = tarefa.statusTarefa;
    txtValorOpc.value = parseFloat(tarefa.valorOpc).toFixed(2);

    if (tarefa.dataInicio) {
        const dataISO = new Date(tarefa.dataInicio);
        const ano = dataISO.getFullYear();
        const mes = String(dataISO.getMonth() + 1).padStart(2, "0");
        const dia = String(dataISO.getDate()).padStart(2, "0");
        txtDataInicio.value = `${ano}-${mes}-${dia}`;
    } else {
        txtDataInicio.value = "";
    }

    if (tarefa.dataFim) {
        const dataISO = new Date(tarefa.dataFim);
        const ano = dataISO.getFullYear();
        const mes = String(dataISO.getMonth() + 1).padStart(2, "0");
        const dia = String(dataISO.getDate()).padStart(2, "0");
        txtDataFim.value = `${ano}-${mes}-${dia}`;
    } else {
        txtDataFim.value = "";
    }

    formEditarContainer.scrollIntoView({ behavior: "smooth" });
}

formEditar.addEventListener("submit", function (event) {
    event.preventDefault();
    esconderRespostaPopup();

    const idTarefa = parseInt(txtIdAtualizar.value);
    const titulo = txtTitulo.value.trim();
    const descricao = txtDescricao.value.trim();
    const status = txtStatus.value.trim();
    const dataInicio = txtDataInicio.value;
    const dataFim = txtDataFim.value;
    const valorOpc = parseFloat(txtValorOpc.value);

    // Validações
    if (isNaN(idTarefa) || idTarefa < 1) {
        mostrarRespostaPopup("ID da tarefa inválido.", false);
        return;
    }
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

    const objAtualizar = {
        tituloTarefa: titulo,
        descricaoTarefa: descricao,
        statusTarefa: status,
        dataInicio: dataInicio,
        dataFim: dataFim,
        valorOpc: valorOpc
    };

    fetchPutAtualizarTarefa(`http://localhost:3000/tarefas/${idTarefa}`, objAtualizar);
});

function fetchPutAtualizarTarefa(URI, obj) {
    const textoJson = JSON.stringify(obj);

    fetch(URI, {
        method: "PUT",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: textoJson
    })
    .then(async response => {
        const data = await response.json();
        console.log("PUT /tarefas/:id →", data);

        if (response.ok && data.status === true) {
            mostrarRespostaPopup(data.message, true);
            formEditar.reset();
            formEditarContainer.classList.add("oculto");
            buscarTodasTarefas();
        } else {
            const msgErro = data.message || "Erro ao atualizar tarefa.";
            mostrarRespostaPopup(msgErro, false);
        }
    })
    .catch(error => {
        console.error("Erro inesperado ao atualizar:", error);
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