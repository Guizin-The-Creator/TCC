// Elementos do DOM
const tabelaUsuariosBody = document
    .getElementById("tabelaUsuarios")
    .getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

// Ao carregar a página, busca todos os usuários
window.addEventListener("DOMContentLoaded", () => {
    buscarTodosUsuarios();
});

/**
 * Faz um GET /usuarios e preenche a tabela com os dados.
 */
function buscarTodosUsuarios() {
    const URI = "http://localhost:3000/usuarios";

    fetch(URI, {
        method: "GET",
        headers: {
            "Accept": "application/json",
           
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
        .then(async response => {
            const data = await response.json();
            console.log("GET /usuarios →", data);

            if (response.ok && data.status === true) {
                preencherTabela(data.data);
            } else {
                const msgErro = data.message || "Erro ao listar usuários.";
                mostrarRespostaPopup(msgErro, false);
            }
        })
        .catch(error => {
            console.error("Erro ao buscar usuários:", error);
            mostrarRespostaPopup("Erro inesperado: " + error.message, false);
        });
}

/**
 * Recebe um array de usuários e insere linhas na tabela.
 * Cada linha terá um botão “Excluir” que chama confirmarEExcluir(id).
 */
function preencherTabela(listaUsuarios) {
    // Limpa conteúdo anterior
    tabelaUsuariosBody.innerHTML = "";

    if (!Array.isArray(listaUsuarios) || listaUsuarios.length === 0) {
        // Se nenhum usuário, exibe linha informativa
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.setAttribute("colspan", "6");
        td.style.textAlign = "center";
        td.innerText = "Nenhum usuário encontrado.";
        tr.appendChild(td);
        tabelaUsuariosBody.appendChild(tr);
        return;
    }

    listaUsuarios.forEach(usuario => {
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

        // Data de Cadastro
        const tdData = document.createElement("td");
        tdData.innerText = usuario.dataCadastro
            ? formatarData(usuario.dataCadastro)
            : "-";
        tr.appendChild(tdData);

        // ID Cargo
        const tdCargo = document.createElement("td");
        tdCargo.innerText = usuario.idCargo;
        tr.appendChild(tdCargo);

        // Coluna Ações (botão Excluir)
        const tdAcoes = document.createElement("td");
        const btnExcluir = document.createElement("button");
        btnExcluir.innerText = "Excluir";
        btnExcluir.classList.add("btnExcluir");
        // A cada botão, armazenamos o ID para usar depois
        btnExcluir.addEventListener("click", () => {
            confirmarEExcluir(usuario.idUsuario);
        });
        tdAcoes.appendChild(btnExcluir);
        tr.appendChild(tdAcoes);

        tabelaUsuariosBody.appendChild(tr);
    });
}

/**
 * Ao clicar em "Excluir", exibe um popup de confirmação (window.confirm).
 * Se confirmado, faz a chamada DELETE e exibe resposta.
 */
function confirmarEExcluir(idUsuario) {
    const confirmacao = window.confirm(
        `Deseja realmente excluir o usuário de ID ${idUsuario}?`
    );
    if (!confirmacao) {
        return; // se cancelou, não faz nada
    }

    // Se confirmou, faz a requisição de exclusão
    fetchDeleteUsuario(`http://localhost:3000/usuarios/${idUsuario}`);
}

/**
 * Faz o DELETE /usuarios/:id e exibe um popup com o resultado
 */
function fetchDeleteUsuario(URI) {
    fetch(URI, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            // Se precisar de token:
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
        .then(async response => {
            const data = await response.json();
            console.log("DELETE /usuarios/:id →", data);

            if (response.ok && data.status === true) {
                mostrarRespostaPopup(data.message, true);
                // Depois de excluir, recarrega a lista
                buscarTodosUsuarios();
            } else {
                const msgErro = data.message || "Falha ao excluir usuário.";
                mostrarRespostaPopup(msgErro, false);
            }
        })
        .catch(error => {
            console.error("Erro inesperado ao excluir:", error);
            mostrarRespostaPopup("Erro inesperado: " + error.message, false);
        });
}

/**
 * Exibe a divResposta com a mensagem e cor adequada.
 * @param {string} mensagem O texto a mostrar
 * @param {boolean} sucesso Se true → fundo verde; senão → fundo vermelho
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
 * Esconde a div de resposta, removendo classes
 */
function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso", "erro");
}

/**
 * Converte uma data ISO (ou string) para "dd/mm/aaaa hh:mm"
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
