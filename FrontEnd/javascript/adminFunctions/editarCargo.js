const tabelaCargosBody = document.getElementById("tabelaCargos").getElementsByTagName("tbody")[0];
const formEditarContainer = document.getElementById("formEditarContainer");
const formEditar = document.getElementById("formEditarCargo");
const txtIdAtualizar = document.getElementById("txtIdAtualizar");
const txtNomeCargo = document.getElementById("txtNomeCargo");
const txtPrioridadeCargo = document.getElementById("txtPrioridadeCargo");
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodosCargos();
});

function buscarTodosCargos() {
  const URI = "http://localhost:3000/cargos";

  fetch(URI, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    }
  })
    .then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === true) {
        preencherTabela(data.data);
      } else {
        mostrarRespostaPopup(data.message || "Erro ao listar cargos.", false);
      }
    })
    .catch((error) => {
      mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

function preencherTabela(listaCargos) {
  tabelaCargosBody.innerHTML = "";

  if (!Array.isArray(listaCargos) || listaCargos.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.innerText = "Nenhum cargo encontrado.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    tabelaCargosBody.appendChild(tr);
    return;
  }

  listaCargos.forEach((cargo) => {
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

    const tdAcoes = document.createElement("td");
    const btnSelecionar = document.createElement("button");
    btnSelecionar.innerText = "Selecionar";
    btnSelecionar.classList.add("btnSelecionar");
    btnSelecionar.addEventListener("click", () => {
      carregarFormulario(cargo);
    });
    tdAcoes.appendChild(btnSelecionar);
    tr.appendChild(tdAcoes);

    tabelaCargosBody.appendChild(tr);
  });
}

function carregarFormulario(cargo) {
  formEditarContainer.classList.remove("oculto");

  txtIdAtualizar.value = cargo.idCargo;
  txtNomeCargo.value = cargo.nomeCargo;
  txtPrioridadeCargo.value = cargo.prioridadeCargo;

  formEditarContainer.scrollIntoView({ behavior: "smooth" });
}

formEditar.addEventListener("submit", function (event) {
  event.preventDefault();
  esconderRespostaPopup();

  const idCargo = parseInt(txtIdAtualizar.value);
  const nome = txtNomeCargo.value.trim();
  const prioridade = parseInt(txtPrioridadeCargo.value);

  if (isNaN(idCargo) || idCargo < 1) {
    mostrarRespostaPopup("ID do cargo inválido.", false);
    return;
  }

  if (nome.length === 0) {
    mostrarRespostaPopup("Nome do cargo obrigatório.", false);
    return;
  }

  if (isNaN(prioridade) || prioridade < 1) {
    mostrarRespostaPopup("Prioridade inválida.", false);
    return;
  }

  const objAtualizar = {
    nomeCargo: nome,
    prioridadeCargo: prioridade
  };

  fetchPutAtualizarCargo(`http://localhost:3000/cargos/${idCargo}`, objAtualizar);
});

function fetchPutAtualizarCargo(URI, obj) {
  fetch(URI, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(obj)
  })
    .then(async (response) => {
      const data = await response.json();
      if (response.ok && data.status === true) {
        mostrarRespostaPopup(data.message, true);
        formEditar.reset();
        formEditarContainer.classList.add("oculto");
        buscarTodosCargos();
      } else {
        mostrarRespostaPopup(data.message || "Erro ao atualizar cargo.", false);
      }
    })
    .catch((error) => {
      mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
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
