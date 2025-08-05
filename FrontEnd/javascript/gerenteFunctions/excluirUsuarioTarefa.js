// excluirUsuarioTarefas.js
const tabelaBody = document.getElementById("tabelaUsuarioTarefas")
    .getElementsByTagName("tbody")[0];
const divResposta = document.getElementById("divResposta");

window.addEventListener("DOMContentLoaded", () => buscarTodasRelacoes());

function buscarTodasRelacoes() {
    fetch("http://localhost:3000/usuariostarefas", {
        method: "GET",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(async res => {
        const data = await res.json();
        console.log("GET →", data);
        if (res.ok && data.status===true) preencherTabela(data.data);
        else mostrarRespostaPopup(data.message||"Erro ao listar",false);
    })
    .catch(err => {
        console.error(err);
        mostrarRespostaPopup("Erro: "+err.message,false);
    });
}

function preencherTabela(lista) {
    tabelaBody.innerHTML = "";
    if (!Array.isArray(lista)||lista.length===0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4; td.style.textAlign = "center";
        td.innerText = "Nenhuma relação.";
        tr.appendChild(td);
        tabelaBody.appendChild(tr);
        return;
    }

    lista.forEach(rel => {
        const tr = document.createElement("tr");
        ["idTarefa","idUsuario","status"].forEach(c => {
            const td = document.createElement("td");
            td.innerText = rel[c];
            tr.appendChild(td);
        });
        const tdA = document.createElement("td");
        const btn = document.createElement("button");
        btn.innerText = "Excluir";
        btn.addEventListener("click", () => confirmarEExcluir(rel.idTarefa, rel.idUsuario));
        tdA.appendChild(btn);
        tr.appendChild(tdA);
        tabelaBody.appendChild(tr);
    });
}

function confirmarEExcluir(idTarefa, idUsuario) {
    const ok = window.confirm(`Deseja excluir relação tarefa ${idTarefa} e usuário ${idUsuario}?`);
    if (!ok) return;
    fetchDelete(`http://localhost:3000/usuariostarefas/${idTarefa}/${idUsuario}`);
}

function fetchDelete(uri) {
    fetch(uri, {
        method: "DELETE",
        headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })
    .then(async res => {
        const data = await res.json();
        console.log("DELETE →", data);
        if (res.ok && data.status===true) {
            mostrarRespostaPopup(data.message, true);
            buscarTodasRelacoes();
        } else mostrarRespostaPopup(data.message||"Erro excluir.",false);
    })
    .catch(err => {
        console.error("DELETE erro", err);
        mostrarRespostaPopup("Erro: "+err.message,false);
    });
}

function mostrarRespostaPopup(msg, sucesso=false) {
    divResposta.innerText = msg;
    divResposta.classList.remove("sucesso","erro");
    divResposta.classList.add(sucesso?"sucesso":"erro");
    divResposta.style.display = "block";
    setTimeout(() => esconderRespostaPopup(), 5000);
}

function esconderRespostaPopup() {
    divResposta.style.display = "none";
    divResposta.classList.remove("sucesso","erro");
}
