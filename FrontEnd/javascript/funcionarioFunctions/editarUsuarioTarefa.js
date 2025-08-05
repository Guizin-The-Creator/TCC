const tabelaBody = document.getElementById("tabelaUsuarioTarefas").getElementsByTagName("tbody")[0];
const formContainer = document.getElementById("formEditarContainer");
const formEditar = document.getElementById("formEditarRelacao");
const selTarefa = document.getElementById("selectIdTarefaEditar");
const selUsuario = document.getElementById("selectIdUsuarioEditar");
const inpStatus = document.getElementById("txtStatusEditar");
const divResposta = document.getElementById("divResposta");

// Apenas status pode ser editado
selTarefa.disabled = true;
selUsuario.disabled = true;

window.addEventListener("DOMContentLoaded", () => {
  buscarTodasRelacoes();
  carregarSelect("usuarios", selUsuario, "idUsuario", "nomeUsuario");
  carregarSelect("tarefas", selTarefa, "idTarefa", "tituloTarefa");
});

function carregarSelect(endpoint, select, campoValor, campoTexto) {
  fetch(`http://localhost:3000/${endpoint}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(async res => {
      if (!res.ok) return mostrarRespostaPopup(`Erro ao carregar ${endpoint}`, false);
      const data = await res.json();
      let lista = [];

      if (endpoint === "usuarios" && data.data) lista = data.data;
      else if (endpoint === "tarefas" && data.tarefas) lista = data.tarefas;

      select.innerHTML = '<option value="">Selecione…</option>';
      lista.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item[campoValor];
        opt.text = item[campoTexto];
        select.appendChild(opt);
      });
    })
    .catch(e => {
      console.error(`Erro no fetch ${endpoint}:`, e);
      mostrarRespostaPopup(`Erro ao carregar ${endpoint}.`, false);
    });
}

function buscarTodasRelacoes() {
  fetch("http://localhost:3000/usuariostarefas", {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(async res => {
      const data = await res.json();
      if (res.ok && data.status === true && Array.isArray(data.associacoes)) {
        preencherTabela(data.associacoes);
      } else {
        mostrarRespostaPopup(data.message || "Erro ao listar.", false);
      }
    })
    .catch(err => {
      console.error(err);
      mostrarRespostaPopup("Erro: " + err.message, false);
    });
}

async function preencherTabela(lista) {
  tabelaBody.innerHTML = "";

  if (!Array.isArray(lista) || lista.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.style.textAlign = "center";
    td.innerText = "Nenhuma relação.";
    tr.appendChild(td);
    tabelaBody.appendChild(tr);
    return;
  }

  for (const rel of lista) {
    const tr = document.createElement("tr");

    const nomeUsuario = await buscarNomeUsuario(rel.usuarios_idUsuario);
    const tituloTarefa = await buscarTituloTarefa(rel.tarefas_idTarefa);

    const tdTarefa = document.createElement("td");
    tdTarefa.innerText = tituloTarefa || `ID ${rel.tarefas_idTarefa}`;
    tr.appendChild(tdTarefa);

    const tdUsuario = document.createElement("td");
    tdUsuario.innerText = nomeUsuario || `ID ${rel.usuarios_idUsuario}`;
    tr.appendChild(tdUsuario);

    const tdStatus = document.createElement("td");
    tdStatus.innerText = rel.status ?? "-";
    tr.appendChild(tdStatus);

    const tdAcoes = document.createElement("td");
    const btn = document.createElement("button");
    btn.innerText = "Selecionar";
    btn.classList.add("btnSelecionar"); // para aplicar o CSS
    btn.addEventListener("click", () => carregarFormulario(rel));
    tdAcoes.appendChild(btn);
    tr.appendChild(tdAcoes);

    tabelaBody.appendChild(tr);
  }
}

function carregarFormulario(rel) {
  formContainer.classList.remove("oculto");
  selTarefa.value = rel.tarefas_idTarefa;
  selUsuario.value = rel.usuarios_idUsuario;
  inpStatus.value = rel.status; // seta o valor da combobox
  formContainer.scrollIntoView({ behavior: "smooth" });
}

formEditar.addEventListener("submit", ev => {
  ev.preventDefault();
  esconderRespostaPopup();

  const idTarefa = parseInt(selTarefa.value);
  const idUsuario = parseInt(selUsuario.value);
  const status = inpStatus.value.trim();

  if (isNaN(idTarefa) || idTarefa < 1) return mostrarRespostaPopup("Tarefa inválida.", false);
  if (isNaN(idUsuario) || idUsuario < 1) return mostrarRespostaPopup("Usuário inválido.", false);
  if (!status) return mostrarRespostaPopup("Status obrigatório.", false);

  // Enviar o objeto completo com os 3 campos e ajustar a URL na ordem certa
  const obj = { idUsuario, idTarefa, status };
  fetchPutAtualizar(`http://localhost:3000/usuariostarefas/${idUsuario}/${idTarefa}`, obj);
});

function fetchPutAtualizar(uri, obj) {
  fetch(uri, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(obj)
  })
    .then(async res => {
      const data = await res.json();
      if (res.ok && data.status === true) {
        mostrarRespostaPopup(data.message, true);
        formEditar.reset();
        formContainer.classList.add("oculto");
        buscarTodasRelacoes();
      } else {
        mostrarRespostaPopup(data.message || "Erro na atualização.", false);
      }
    })
    .catch(err => {
      console.error("PUT erro", err);
      mostrarRespostaPopup("Erro: " + err.message, false);
    });
}

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.classList.remove("sucesso", "erro");
  divResposta.classList.add(sucesso ? "sucesso" : "erro");
  divResposta.style.display = "block";
  setTimeout(() => esconderRespostaPopup(), 5000);
}

function esconderRespostaPopup() {
  divResposta.style.display = "none";
  divResposta.classList.remove("sucesso", "erro");
}

async function buscarNomeUsuario(id) {
  try {
    const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    return data?.data?.nomeUsuario || `ID ${id}`;
  } catch (err) {
    console.warn(`Erro ao buscar nome do usuário ${id}:`, err);
    return `ID ${id}`;
  }
}

async function buscarTituloTarefa(id) {
  try {
    const res = await fetch(`http://localhost:3000/tarefas/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    return data?.tarefa?.tituloTarefa || `ID ${id}`;
  } catch (err) {
    console.warn(`Erro ao buscar título da tarefa ${id}:`, err);
    return `ID ${id}`;
  }
}
