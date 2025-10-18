// Elementos DOM
const txtEmail = document.getElementById("txtEmail");
const txtSenha = document.getElementById("txtSenha");
const btnLogin = document.getElementById("btnLogin");
const formLogin = document.getElementById("formLogin");
const togglePassword = document.getElementById("togglePassword");
const divResposta = document.getElementById("divResposta");

// Inicializar ícones Lucide
function atualizarIconesLucide() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Função para exibir toast moderno
function exibirToast(titulo, descricao, tipo = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const icone = tipo === 'success' ? 'check-circle' : 'alert-circle';

    toast.innerHTML = `
    <i data-lucide="${icone}" class="toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${escaparHTML(titulo)}</div>
      <div class="toast-description">${escaparHTML(descricao)}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <i data-lucide="x" class="toast-close-icon"></i>
    </button>
  `;

    container.appendChild(toast);

    // Atualizar ícones do toast
    setTimeout(() => atualizarIconesLucide(), 10);

    // Remover toast após 5 segundos
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Função para escapar HTML (segurança)
function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// Função para mostrar popup de resposta (fallback)
function mostrarRespostaPopup(mensagem, sucesso = true, tempo = 5000) {
    if (!divResposta) {
        alert(mensagem);
        return;
    }
    divResposta.innerText = mensagem;
    divResposta.className = sucesso ? 'resposta-popup sucesso' : 'resposta-popup erro';
    divResposta.style.display = 'block';

    setTimeout(() => {
        divResposta.style.display = 'none';
    }, tempo);
}

// Toggle visibilidade da senha
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        const tipo = txtSenha.type === 'password' ? 'text' : 'password';
        txtSenha.type = tipo;

        const icone = togglePassword.querySelector('.toggle-icon');
        if (icone) {
            const novoIcone = tipo === 'password' ? 'eye' : 'eye-off';
            icone.setAttribute('data-lucide', novoIcone);
            atualizarIconesLucide();
        }
    });
}

// Validação de email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Função para decodificar JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join('')
        );
        return JSON.parse(jsonPayload);
    } catch (erro) {
        console.error("Erro ao decodificar token:", erro);
        return null;
    }
}

// Função de redirecionamento baseado no cargo
function redirecionarPorCargo(nomeCargo) {
    const cargo = nomeCargo.toLowerCase();

    if (cargo.includes("administrador do sistema")) {
        window.location.href = "../html/adminFunctions/adm.html";
    } else if (cargo.includes("gerente financeiro")) {
        window.location.href = "../html/gerenteFinanceiroFunctions/gerenteFinanceiro.html";
    } else if (cargo.includes("funcionario financeiro")) {
        window.location.href = "../html/funcionarioFinanceiroFunctions/funcionarioFinanceiro.html";
    } else if (cargo.includes("gerente") && !cargo.includes("financeiro")) {
        window.location.href = "../html/gerenteFunctions/gerente.html";
    } else if (cargo.includes("funcionario") && !cargo.includes("financeiro")) {
        window.location.href = "../html/funcionario/funcionario.html";
    } else {
        exibirToast("Erro", "Cargo não reconhecido: " + nomeCargo, "error");
    }
}

// Função para realizar o login
async function realizarLogin(email, senha) {
    const URI = "http://localhost:3000/usuarios/login";

    const obj = {
        emailUsuario: email,
        senhaUsuario: senha
    };

    try {
        const response = await fetch(URI, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(obj)
        });

        const data = await response.json();

        console.log("Resposta do servidor:", data);
        console.log("Status HTTP:", response.status);

        if (response.ok && data.status === true && data.token) {
            // Armazena o token no localStorage
            const token = data.token;
            const tokenObj = {
                token: token,
                timestamp: Date.now()
            };
            localStorage.setItem("authToken", JSON.stringify(tokenObj));

            // Decodifica o token para extrair nomeCargo
            const payload = parseJwt(token);

            if (!payload) {
                exibirToast("Erro", "Falha ao processar autenticação", "error");
                return;
            }

            console.log("Payload do token:", payload);

            const nomeCargo = payload.nomeCargo;

            if (!nomeCargo) {
                exibirToast("Erro", "Informações de cargo não encontradas", "error");
                return;
            }

            console.log("Nome do Cargo:", nomeCargo);

            // Exibe mensagem de sucesso
            exibirToast("Sucesso!", data.message || "Login realizado com sucesso!", "success");

            // Aguarda um momento para o usuário ver a mensagem
            setTimeout(() => {
                redirecionarPorCargo(nomeCargo);
            }, 1000);

        } else {
            // Erro de autenticação
            const mensagemErro = data.message || "Email ou senha incorretos";
            exibirToast("Erro de Autenticação", mensagemErro, "error");
        }

    } catch (erro) {
        console.error("Erro na requisição:", erro);
        exibirToast("Erro de Conexão", "Não foi possível conectar ao servidor. Tente novamente.", "error");
    }
}

// Handler do formulário de login
async function handleLogin(event) {
    event.preventDefault();

    // Validações
    const email = txtEmail.value.trim();
    if (!email) {
        exibirToast("Campo Obrigatório", "Por favor, informe seu e-mail", "error");
        txtEmail.focus();
        return;
    }

    if (!validarEmail(email)) {
        exibirToast("E-mail Inválido", "Por favor, informe um e-mail válido", "error");
        txtEmail.focus();
        return;
    }

    const senha = txtSenha.value.trim();
    if (!senha) {
        exibirToast("Campo Obrigatório", "Por favor, informe sua senha", "error");
        txtSenha.focus();
        return;
    }

    if (senha.length < 3) {
        exibirToast("Senha Inválida", "A senha deve ter no mínimo 3 caracteres", "error");
        txtSenha.focus();
        return;
    }

    // Adiciona estado de loading no botão
    btnLogin.classList.add('loading');
    btnLogin.disabled = true;

    try {
        await realizarLogin(email, senha);
    } finally {
        // Remove estado de loading
        btnLogin.classList.remove('loading');
        btnLogin.disabled = false;
    }
}

// Event Listeners
if (formLogin) {
    formLogin.addEventListener('submit', handleLogin);
}

// Prevenir múltiplos cliques no botão
if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
        if (btnLogin.classList.contains('loading')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

// Limpar mensagens de erro ao digitar
if (txtEmail) {
    txtEmail.addEventListener('input', () => {
        txtEmail.classList.remove('error');
    });
}

if (txtSenha) {
    txtSenha.addEventListener('input', () => {
        txtSenha.classList.remove('error');
    });
}

// Verificar se já está logado ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    const authData = localStorage.getItem("authToken");

    if (authData) {
        try {
            const { token, timestamp } = JSON.parse(authData);
            const tempoDecorrido = Date.now() - timestamp;
            const TEMPO_EXPIRACAO = 24 * 60 * 60 * 1000; // 24 horas

            if (tempoDecorrido < TEMPO_EXPIRACAO) {
                // Token ainda válido, redirecionar
                const payload = parseJwt(token);
                if (payload && payload.nomeCargo) {
                    console.log("Usuário já autenticado, redirecionando...");
                    redirecionarPorCargo(payload.nomeCargo);
                    return;
                }
            } else {
                // Token expirado, limpar
                localStorage.removeItem("authToken");
            }
        } catch (erro) {
            console.error("Erro ao verificar autenticação:", erro);
            localStorage.removeItem("authToken");
        }
    }

    // Inicializar ícones Lucide
    atualizarIconesLucide();

    // Focar no campo de email
    if (txtEmail) {
        txtEmail.focus();
    }
});

// Suporte para tecla Enter
if (txtEmail) {
    txtEmail.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            txtSenha.focus();
        }
    });
}

if (txtSenha) {
    txtSenha.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !btnLogin.classList.contains('loading')) {
            formLogin.dispatchEvent(new Event('submit'));
        }
    });
}

// Animação suave ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'translateY(20px)';

        setTimeout(() => {
            loginCard.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
        }, 100);
    }
});