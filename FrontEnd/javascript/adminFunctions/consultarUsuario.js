// Elementos do DOM
const tabelaUsuarios = document.getElementById("tabelaUsuarios").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

// Ao carregar a página, já dispara a busca
window.addEventListener("DOMContentLoaded", () => {
    buscarTodosUsuarios();
});

function buscarTodosUsuarios() {
    const URI = "http://localhost:3000/usuarios"; // endpoint GET /usuarios

    // Caso você precise enviar token no header, descomente as linhas abaixo:
    const token = localStorage.getItem("token");
    // if (!token) {
    //     mostrarRespostaPopup("Token não encontrado. Faça login primeiro.");
    //     return;
    // }
    fetch(URI, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    })
    .then(async response => {
        const data = await response.json();
        
        console.log("Resposta completa do servidor (GET /usuarios):", data);
        console.log("Status HTTP:", response.status);

        if (response.ok && data.status === true) {
            preencherTabela(data.data);
        } else {
            const msg = data.message || "Erro ao obter usuários.";
            mostrarRespostaPopup(msg);
        }
    })
    .catch(error => {
        console.error("Erro inesperado ao buscar usuários:", error);
        mostrarRespostaPopup("Erro inesperado: " + error.message);
    });
}

function preencherTabela(listaUsuarios) {
    // Limpa qualquer linha anterior
    tabelaUsuarios.innerHTML = "";

    if (!Array.isArray(listaUsuarios) || listaUsuarios.length === 0) {
        mostrarRespostaPopup("Nenhum usuário encontrado.", "#FFA726"); // laranja
        return;
    }

    // Para cada usuário, cria uma linha na tabela
    listaUsuarios.forEach(usuario => {
        const tr = document.createElement("tr");

        // Coluna ID
        const tdId = document.createElement("td");
        tdId.innerText = usuario.idUsuario;
        tr.appendChild(tdId);

        // Coluna Nome
        const tdNome = document.createElement("td");
        tdNome.innerText = usuario.nomeUsuario;
        tr.appendChild(tdNome);

        // Coluna Email
        const tdEmail = document.createElement("td");
        tdEmail.innerText = usuario.emailUsuario;
        tr.appendChild(tdEmail);

        // Coluna Data de Cadastro
        const tdData = document.createElement("td");
        // Se a data vier null ou vazia, exibe '-'
        tdData.innerText = usuario.dataCadastro ? formatarData(usuario.dataCadastro) : "-";
        tr.appendChild(tdData);

        // Coluna ID Cargo
        const tdCargo = document.createElement("td");
        tdCargo.innerText = usuario.idCargo;
        tr.appendChild(tdCargo);

        tabelaUsuarios.appendChild(tr);
    });
}

// Função auxiliar para formatar uma string de data (caso venha em ISO) 
// Exemplo: "2024-05-12T15:30:00.000Z" → "12/05/2024 15:30"
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

function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
    divResposta.innerText = mensagem;
    divResposta.style.backgroundColor = corFundo;
    divResposta.style.display = "block";

    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
