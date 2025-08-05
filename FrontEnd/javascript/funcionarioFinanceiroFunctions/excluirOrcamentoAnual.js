const tabelaOrcamentosBody = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodosOrcamentos();
});

function buscarTodosOrcamentos() {
    fetch("http://localhost:3000/orcamentosanuais", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
            // AQUI ESTAVA O ERRO:
            preencherTabela(data.orcamentos);
        } else {
            mostrarRespostaPopup(data.message || "Erro ao buscar orçamentos.");
        }
    })
    .catch(err => {
        mostrarRespostaPopup("Erro inesperado: " + err.message);
    });
}

function preencherTabela(lista) {
    tabelaOrcamentosBody.innerHTML = "";

    lista.forEach(o => {
        const valor = parseFloat(o.valorOrcamentoAnual);
        const valorFormatado = isNaN(valor) ? "-" : `R$ ${valor.toFixed(2)}`;

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.idOrcamentoAnual}</td>
            <td>${valorFormatado}</td>
            <td>${o.anoOrcamentoAnual}</td>
            <td>${o.idCategoria}</td>
            <td><button onclick="confirmarExclusao(${o.idOrcamentoAnual})">Excluir</button></td>
        `;

        tabelaOrcamentosBody.appendChild(tr);
    });
}


function confirmarExclusao(id) {
    const confirmar = window.confirm(`Deseja realmente excluir o orçamento de ID ${id}?`);
    if (!confirmar) return;

    fetch(`http://localhost:3000/orcamentosanuais/${id}`, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
            mostrarRespostaPopup(data.message, true);
            buscarTodosOrcamentos();
        } else {
            mostrarRespostaPopup(data.message || "Erro ao excluir orçamento.");
        }
    });
}

function mostrarRespostaPopup(msg, sucesso = false) {
    divResposta.innerText = msg;
    divResposta.classList.remove("sucesso", "erro");
    divResposta.classList.add(sucesso ? "sucesso" : "erro");
    divResposta.style.display = "block";
    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
