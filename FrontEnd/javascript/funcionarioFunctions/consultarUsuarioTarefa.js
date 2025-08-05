

const tabelaBody = document
  .getElementById("tabelaUsuarioTarefas")
  .getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodasRelacoes();
});

function buscarTodasRelacoes() {
  const URI = "http://localhost:3000/usuariostarefas";
  const token = localStorage.getItem("token");

  if (!token) {
    mostrarRespostaPopup("Token não encontrado. Faça login.", false);
    return;
  }

  fetch(URI, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data.status === true && Array.isArray(data.associacoes)) {
        preencherTabela(data.associacoes);
      } else {
        mostrarRespostaPopup(data.message || "Erro ao listar relações.", false);
      }
    })
    .catch((err) => {
      console.error("Erro ao buscar relações:", err);
      mostrarRespostaPopup("Erro inesperado: " + err.message, false);
    });
}

async function preencherTabela(lista) {
  tabelaBody.innerHTML = "";

  if (lista.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.style.textAlign = "center";
    td.innerText = "Nenhuma relação encontrada.";
    tr.appendChild(td);
    tabelaBody.appendChild(tr);
    return;
  }

  for (const rel of lista) {
    const tr = document.createElement("tr");

    // Obtém nome do usuário
    const nomeUsuario = await buscarNomeUsuario(rel.usuarios_idUsuario);
    const tdUsuario = document.createElement("td");
    tdUsuario.innerText = nomeUsuario || `ID ${rel.usuarios_idUsuario}`;
    tr.appendChild(tdUsuario);

    // Obtém título da tarefa
    const tituloTarefa = await buscarTituloTarefa(rel.tarefas_idTarefa);
    const tdTarefa = document.createElement("td");
    tdTarefa.innerText = tituloTarefa || `ID ${rel.tarefas_idTarefa}`;
    tr.appendChild(tdTarefa);

    // Status
    const tdStatus = document.createElement("td");
    tdStatus.innerText = rel.status ?? "-";
    tr.appendChild(tdStatus);

    tabelaBody.appendChild(tr);
  }
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
  

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.classList.remove("sucesso", "erro");
  divResposta.classList.add(sucesso ? "sucesso" : "erro");
  divResposta.style.display = "block";
  setTimeout(esconderRespostaPopup, 5000);
}

function esconderRespostaPopup() {
  divResposta.style.display = "none";
  divResposta.classList.remove("sucesso", "erro");
}
