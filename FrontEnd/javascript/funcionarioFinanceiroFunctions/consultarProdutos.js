// consultarProdutos.js
const tabelaProdutos = document.getElementById("tabelaProdutos").getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => {
    buscarTodosProdutos();
});

function buscarTodosProdutos() {
    fetch("http://localhost:3000/produtos", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
            preencherTabela(data.produtos);
        } else {
            mostrarRespostaPopup(data.message || "Erro ao buscar produtos.");
        }
    })
    .catch(err => {
        mostrarRespostaPopup("Erro inesperado: " + err.message);
    });
}

function preencherTabela(lista) {
    tabelaProdutos.innerHTML = "";
    if (!Array.isArray(lista) || lista.length === 0) {
        mostrarRespostaPopup("Nenhum produto encontrado.", "#FFA726");
        return;
    }
    lista.forEach(p => {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        tdId.innerText = p.idProduto;
        tr.appendChild(tdId);

        const tdNome = document.createElement("td");
        tdNome.innerText = p.nomeProduto;
        tr.appendChild(tdNome);

        const tdCusto = document.createElement("td");
        const custo = parseFloat(p.custoProduto);
        tdCusto.innerText = isNaN(custo) ? "-" : `R$ ${custo.toFixed(2)}`;
        tr.appendChild(tdCusto);

        const tdSegmento = document.createElement("td");
        tdSegmento.innerText = p.idSegmento;
        tr.appendChild(tdSegmento);

        const tdSubsegmento = document.createElement("td");
        tdSubsegmento.innerText = p.idSubsegmento;
        tr.appendChild(tdSubsegmento);

        tabelaProdutos.appendChild(tr);
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
