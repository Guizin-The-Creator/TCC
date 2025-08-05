const tabelaOrcamentosBody = document.getElementById("tabelaOrcamentos").getElementsByTagName("tbody")[0];
const formEditar = document.getElementById("formEditarOrcamento");
const formEditarContainer = document.getElementById("formEditarContainer");
const divResposta = document.getElementById("divResposta");

const txtId = document.getElementById("txtId");
const txtValor = document.getElementById("txtValor");
const txtAno = document.getElementById("txtAno");
const txtCategoria = document.getElementById("txtCategoria");

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

        const btnSelecionar = document.createElement("button");
        btnSelecionar.innerText = "Selecionar";
        btnSelecionar.classList.add("btnSelecionar");
        btnSelecionar.addEventListener("click", () => {
            carregarFormulario(o.idOrcamentoAnual, o.valorOrcamentoAnual, o.anoOrcamentoAnual, o.idCategoria);
        });

        const tdAcoes = document.createElement("td");
        tdAcoes.appendChild(btnSelecionar);

        tr.innerHTML = `
            <td>${o.idOrcamentoAnual}</td>
            <td>${valorFormatado}</td>
            <td>${o.anoOrcamentoAnual}</td>
            <td>${o.idCategoria}</td>
        `;
        tr.appendChild(tdAcoes);

        tabelaOrcamentosBody.appendChild(tr);
    });
}

function carregarFormulario(id, valor, ano, categoria) {
    txtId.value = id;
    txtValor.value = valor;
    txtAno.value = ano;
    txtCategoria.value = categoria;
    formEditarContainer.classList.remove("oculto");
    window.scrollTo({ top: formEditarContainer.offsetTop, behavior: 'smooth' });
}

formEditar.addEventListener("submit", function(e) {
    e.preventDefault();

    const id = parseInt(txtId.value);
    const valor = parseFloat(txtValor.value);
    const ano = parseInt(txtAno.value);
    const idCategoria = parseInt(txtCategoria.value);

    if (!id || isNaN(valor) || isNaN(ano) || isNaN(idCategoria)) {
        mostrarRespostaPopup("Dados inválidos para atualização.");
        return;
    }

    const obj = {
        valorOrcamentoAnual: valor,
        anoOrcamentoAnual: ano,
        idCategoria: idCategoria
    };

    fetch(`http://localhost:3000/orcamentosanuais/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(obj)
    })
    .then(async res => {
        const data = await res.json();
        if (res.ok && data.status) {
            mostrarRespostaPopup(data.message, true);
            formEditar.reset();
            formEditarContainer.classList.add("oculto");
            buscarTodosOrcamentos();
        } else {
            mostrarRespostaPopup(data.message || "Erro ao atualizar.");
        }
    });
});

function mostrarRespostaPopup(msg, sucesso = false) {
    divResposta.innerText = msg;
    divResposta.classList.remove("sucesso", "erro");
    divResposta.classList.add(sucesso ? "sucesso" : "erro");
    divResposta.style.display = "block";
    setTimeout(() => {
        divResposta.style.display = "none";
    }, 5000);
}
