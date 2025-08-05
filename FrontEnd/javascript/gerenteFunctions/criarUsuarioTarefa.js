const formCriar   = document.getElementById("formCriarRelacao");
const selUsuario  = document.getElementById("selectIdUsuario");
const selTarefa   = document.getElementById("selectIdTarefa");
const inpStatus   = document.getElementById("txtStatus");
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
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
  .then(async r => {
    if (!r.ok) {
      console.error(`Erro HTTP ao acessar ${endpoint}:`, r.status, r.statusText);
      mostrarRespostaPopup(`Falha ao carregar ${endpoint}. Status ${r.status}`, false);
      return;
    }
    const data = await r.json();

    if (data.status) {
      select.innerHTML = '<option value="">Selecione…</option>';

      let lista = [];
      if (endpoint === "usuarios" && data.data) {
        lista = data.data;
      } else if (endpoint === "tarefas" && data.tarefas) {
        lista = data.tarefas;
      }

      lista.forEach(item => {
        const opt = document.createElement("option");
        opt.value = parseInt(item[campoValor]); // <-- ID numérico
        opt.text  = item[campoTexto]; // <-- Nome ou título visível
        select.appendChild(opt);
      });
    } else {
      console.error(`Resposta da API com status false para ${endpoint}:`, data);
      mostrarRespostaPopup(`Falha ao carregar ${endpoint}.`, false);
    }
  })
  .catch(e => {
    console.error(`Erro no fetch ${endpoint}:`, e);
    mostrarRespostaPopup(`Erro ao carregar ${endpoint}.`, false);
  });
}

formCriar.addEventListener("submit", async e => {
  e.preventDefault();
  esconderRespostaPopup();

  const idUsuario = parseInt(selUsuario.value);
  const idTarefa = parseInt(selTarefa.value);
  const status = inpStatus.value.trim();

  if (isNaN(idUsuario)) return mostrarRespostaPopup("Escolha um usuário.", false);
  if (isNaN(idTarefa)) return mostrarRespostaPopup("Escolha uma tarefa.", false);
  if (!status) return mostrarRespostaPopup("Status obrigatório.", false);

  try {
    const res = await fetch("http://localhost:3000/usuariostarefas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ idUsuario, idTarefa, status }) // <-- Apenas IDs são enviados
    });
    const d = await res.json();
    if (res.ok && d.status) {
      mostrarRespostaPopup(d.message, true);
      formCriar.reset();
    } else {
      mostrarRespostaPopup(d.message || "Erro ao criar.", false);
    }
  } catch (err) {
    console.error("Erro inesperado:", err);
    mostrarRespostaPopup("Erro: " + err.message, false);
  }
});

function mostrarRespostaPopup(msg, sucesso = false) {
  divResposta.innerText = msg;
  divResposta.style.color = sucesso ? "green" : "red";
  divResposta.style.display = "block";
  setTimeout(esconderRespostaPopup, 5000);
}

function esconderRespostaPopup() {
  divResposta.style.display = "none";
  divResposta.innerText = "";
}
