const tabelaOrcamentos = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
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
    tabelaOrcamentos.innerHTML = "";

    if (!Array.isArray(lista) || lista.length === 0) {
        mostrarRespostaPopup("Nenhum orçamento trimestral encontrado.", "#FFA726");
        return;
    }

    lista.forEach(o => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.idOrcamentoTri}</td>
            <td>R$ ${parseFloat(o.valorOrcamentoTri).toFixed(2)}</td>
            <td>${o.trimestreOrcamentoTri}</td>
            <td>${o.idOrcamentoAnual}</td>
            <td>${o.idCategoria}</td>
        `;

        tabelaOrcamentos.appendChild(tr);
    });
}

function mostrarRespostaPopup(mensagem, corFundo = "#f44336") {
    divResposta.innerText = mensagem;
    divResposta.style.backgroundColor = corFundo;
    divResposta.style.display = "block";
    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
