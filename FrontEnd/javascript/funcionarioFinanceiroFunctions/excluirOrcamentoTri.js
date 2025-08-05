const tabelaBody = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodosOrcamentos();
});

function buscarTodosOrcamentos() {
    fetch("http://localhost:3000/orcamentostri", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
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
    tabelaBody.innerHTML = "";

    lista.forEach(o => {
        const valorFormatado = `R$ ${parseFloat(o.valorOrcamentoTri).toFixed(2)}`;
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.idOrcamentoTri}</td>
            <td>${valorFormatado}</td>
            <td>${o.trimestreOrcamentoTri}</td>
            <td>${o.idOrcamentoAnual}</td>
            <td>${o.idCategoria}</td>
            <td><button onclick="confirmarExclusao(${o.idOrcamentoTri})">Excluir</button></td>
        `;

        tabelaBody.appendChild(tr);
    });
}

function confirmarExclusao(id) {
    const confirmar = window.confirm(`Deseja realmente excluir o orçamento trimestral de ID ${id}?`);
    if (!confirmar) return;

    fetch(`http://localhost:3000/orcamentostri/${id}`, {
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
