// Elementos do DOM
const tabelaUsuariosBody = document
  .getElementById("tabelaUsuarios")
  .getElementsByTagName("tbody")[0];
const formEditarContainer = document.getElementById("formEditarContainer");
const formEditar = document.getElementById("formEditarUsuario");
const txtIdAtualizar = document.getElementById("txtIdAtualizar");
const txtNome = document.getElementById("txtNome");
const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const txtDataCadastro = document.getElementById("txtDataCadastro");
const txtIdCargo = document.getElementById("txtIdCargo");
const divResposta = document.getElementById("divResposta");

// Ao carregar a página, busca todos os usuários
window.addEventListener("DOMContentLoaded", () => {
  buscarTodosUsuarios();
});

/**
 * Faz GET /usuarios e preenche a tabela.
 */
function buscarTodosUsuarios() {
  const URI = "http://localhost:3000/usuarios";

  fetch(URI, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      // Se necessário enviar token:
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    }
  })
    .then(async (response) => {
      const data = await response.json();
      console.log("GET /usuarios →", data);

      if (response.ok && data.status === true) {
        preencherTabela(data.data);
      } else {
        const msgErro = data.message || "Erro ao listar usuários.";
        mostrarRespostaPopup(msgErro, false);
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar usuários:", error);
      mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

/**
 * Recebe array de usuários e insere linhas na tabela com botão “Selecionar”.
 */
function preencherTabela(listaUsuarios) {
  // Limpa linhas antigas
  tabelaUsuariosBody.innerHTML = "";

  if (!Array.isArray(listaUsuarios) || listaUsuarios.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.setAttribute("colspan", "6");
    td.style.textAlign = "center";
    td.innerText = "Nenhum usuário encontrado.";
    tr.appendChild(td);
    tabelaUsuariosBody.appendChild(tr);
    return;
  }

  listaUsuarios.forEach((usuario) => {
    const tr = document.createElement("tr");

    // ID
    const tdId = document.createElement("td");
    tdId.innerText = usuario.idUsuario;
    tr.appendChild(tdId);

    // Nome
    const tdNome = document.createElement("td");
    tdNome.innerText = usuario.nomeUsuario;
    tr.appendChild(tdNome);

    // Email
    const tdEmail = document.createElement("td");
    tdEmail.innerText = usuario.emailUsuario;
    tr.appendChild(tdEmail);

    // Data de Cadastro (formatada ou “-”)
    const tdData = document.createElement("td");
    tdData.innerText = usuario.dataCadastro
      ? formatarData(usuario.dataCadastro)
      : "-";
    tr.appendChild(tdData);

    // ID Cargo
    const tdCargo = document.createElement("td");
    tdCargo.innerText = usuario.idCargo;
    tr.appendChild(tdCargo);

    // Ações: botão “Selecionar”
    const tdAcoes = document.createElement("td");
    const btnSelecionar = document.createElement("button");
    btnSelecionar.innerText = "Selecionar";
    btnSelecionar.classList.add("btnSelecionar");
    btnSelecionar.addEventListener("click", () => {
      carregarFormulario(usuario);
    });
    tdAcoes.appendChild(btnSelecionar);
    tr.appendChild(tdAcoes);

    tabelaUsuariosBody.appendChild(tr);
  });
}

/**
 * Quando o usuário clica em “Selecionar”, esta função:
 * 1) Remove a classe .oculto do formEditarContainer para mostrar o formulário.
 * 2) Preenche cada campo com os dados do usuário.
 */
function carregarFormulario(usuario) {
  // Exibe o formulário
  formEditarContainer.classList.remove("oculto");

  // Preenche campos
  txtIdAtualizar.value = usuario.idUsuario;
  txtNome.value = usuario.nomeUsuario;
  txtEmail.value = usuario.emailUsuario;
  // Para a senha: recomendamos que quem edita digite uma nova. Limpamos por segurança.
  txtSenha.value = "";

  // Data de Cadastro: converte para YYYY-MM-DD caso venha com hora.
  if (usuario.dataCadastro) {
    const dataISO = new Date(usuario.dataCadastro);
    const ano = dataISO.getFullYear();
    const mes = String(dataISO.getMonth() + 1).padStart(2, "0");
    const dia = String(dataISO.getDate()).padStart(2, "0");
    txtDataCadastro.value = `${ano}-${mes}-${dia}`;
  } else {
    txtDataCadastro.value = "";
  }

  txtIdCargo.value = usuario.idCargo;
  // Ao carregar, rola a página para o formulário ficar visível
  formEditarContainer.scrollIntoView({ behavior: "smooth" });
}

/**
 * Ao submeter o formulário de edição, fazemos PUT /usuarios/:id
 */
formEditar.addEventListener("submit", function (event) {
  event.preventDefault();
  esconderRespostaPopup();

  const idUsuario = parseInt(txtIdAtualizar.value);
  const nome = txtNome.value.trim();
  const email = txtEmail.value.trim();
  const senha = txtSenha.value.trim();
  const dataCadastro = txtDataCadastro.value;
  const idCargo = parseInt(txtIdCargo.value);

  // Validações básicas
  if (isNaN(idUsuario) || idUsuario < 1) {
    mostrarRespostaPopup("ID de usuário inválido.", false);
    return;
  }
  if (nome.length === 0) {
    mostrarRespostaPopup("Nome obrigatório.", false);
    return;
  }
  if (!email.includes("@")) {
    mostrarRespostaPopup("E-mail inválido.", false);
    return;
  }
  if (senha.length < 6) {
    mostrarRespostaPopup("Senha deve ter ao menos 6 caracteres.", false);
    return;
  }
  if (!dataCadastro) {
    mostrarRespostaPopup("Data de cadastro obrigatória.", false);
    return;
  }
  if (isNaN(idCargo) || idCargo < 1) {
    mostrarRespostaPopup("ID Cargo inválido.", false);
    return;
  }

  const objAtualizar = {
    nomeUsuario: nome,
    emailUsuario: email,
    senhaUsuario: senha,
    dataCadastro: dataCadastro,
    idCargo: idCargo
  };

  fetchPutAtualizarUsuario(`http://localhost:3000/usuarios/${idUsuario}`, objAtualizar);
});

/**
 * Faz o PUT /usuarios/:id com o JSON no body e exibe feedback.
 */
function fetchPutAtualizarUsuario(URI, obj) {
  const textoJson = JSON.stringify(obj);

  fetch(URI, {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      // Se a rota exigir token:
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: textoJson
  })
    .then(async (response) => {
      const data = await response.json();
      console.log("PUT /usuarios/:id →", data);

      if (response.ok && data.status === true) {
        mostrarRespostaPopup(data.message, true);
        formEditar.reset();
        // Opcional: esconder o formulário após atualizar
        formEditarContainer.classList.add("oculto");
        // Recarrega a lista para refletir mudanças
        buscarTodosUsuarios();
      } else {
        const msgErro = data.message || "Erro ao atualizar usuário.";
        mostrarRespostaPopup(msgErro, false);
      }
    })
    .catch((error) => {
      console.error("Erro inesperado ao atualizar:", error);
      mostrarRespostaPopup("Erro inesperado: " + error.message, false);
    });
}

/**
 * Exibe a divResposta com a mensagem e cores apropriadas.
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

function esconderRespostaPopup() {
  divResposta.style.display = "none";
  divResposta.classList.remove("sucesso", "erro");
}

/**
 * Converte uma data ISO (ou string) para formato “dd/mm/aaaa hh:mm”
 */
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
