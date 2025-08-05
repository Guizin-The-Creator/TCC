const tabelaBody = document
  .getElementById("tabelaUsuarioTarefas")
  .getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
  buscarTodasRelacoes();
});

async function buscarTodasRelacoes() {
  try {
    const res = await fetch("http://localhost:3000/usuariostarefas", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();

    if (res.ok && data.status && Array.isArray(data.associacoes)) {
      preencherTabela(data.associacoes);
    } else {
      mostrarRespostaPopup(data.message || "Erro ao listar relações.", false);
    }
  } catch (err) {
    console.error("Erro:", err);
    mostrarRespostaPopup("Erro inesperado: " + err.message, false);
  }
}

async function preencherTabela(lista) {
  tabelaBody.innerHTML = "";

  if (!lista.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="text-align:center;">Nenhuma relação encontrada.</td>`;
    tabelaBody.appendChild(tr);
    return;
  }

  for (const rel of lista) {
    const tr = document.createElement("tr");
    const tituloTarefa = await buscarTituloTarefa(rel.tarefas_idTarefa);
    const nomeUsuario = await buscarNomeUsuario(rel.usuarios_idUsuario);

    tr.innerHTML = `
      <td>${rel.tarefas_idTarefa}</td>
      <td>${tituloTarefa}</td>
      <td>${rel.usuarios_idUsuario}</td>
      <td>${nomeUsuario}</td>
      <td>${rel.status ?? "-"}</td>
    `;
    tabelaBody.appendChild(tr);
  }
}

async function buscarNomeUsuario(id) {
  try {
    const res = await fetch(`http://localhost:3000/usuarios/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    return data?.data?.nomeUsuario || `ID ${id}`;
  } catch {
    return `ID ${id}`;
  }
}

async function buscarTituloTarefa(id) {
  try {
    const res = await fetch(`http://localhost:3000/tarefas/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    const data = await res.json();
    return data?.tarefa?.tituloTarefa || `ID ${id}`;
  } catch {
    return `ID ${id}`;
  }
}

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.className = sucesso ? "sucesso" : "erro";
  divResposta.style.display = "block";
  setTimeout(() => (divResposta.style.display = "none"), 5000);
}
