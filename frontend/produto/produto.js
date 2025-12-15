// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentProdutoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('produtoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const produtosTableBody = document.getElementById('produtosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
});

// Event Listeners
btnBuscar.addEventListener('click', buscarProduto);
btnIncluir.addEventListener('click', incluirProduto);
btnAlterar.addEventListener('click', alterarProduto);
btnExcluir.addEventListener('click', excluirProduto);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// ---------- Funções utilitárias ----------
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => messageContainer.innerHTML = '', 3000);
}

function bloquearCampos(habilitar) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        if (index === 0) {
            input.disabled = false; // ID sempre editável
        } else {
            input.disabled = !habilitar;
        }
    });
}

function limparFormulario() {
    form.reset();
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// ---------- CRUD ----------
async function buscarProduto() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produto/${id}`);
        if (response.ok) {
            const produto = await response.json();
            preencherFormulario(produto);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Produto encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Produto não encontrado. Você pode incluir um novo.', 'info');
        } else {
            throw new Error('Erro ao buscar produto');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar produto', 'error');
    }
}

function preencherFormulario(produto) {
    currentProdutoId = produto.idproduto;
    searchId.value = produto.idproduto;
    document.getElementById('nomeproduto').value = produto.nomeproduto || '';
    document.getElementById('quantidadeemestoque').value = produto.quantidadeemestoque || 0;
    document.getElementById('precounitario').value = produto.precounitario || 0;
}

function incluirProduto() {
    mostrarMensagem('Digite os dados!', 'success');
    currentProdutoId = searchId.value;
    limparFormulario();
    searchId.value = currentProdutoId;
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nomeproduto').focus();
    operacao = 'incluir';
}

function alterarProduto() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nomeproduto').focus();
    operacao = 'alterar';
}

function excluirProduto() {
    mostrarMensagem('Confirme a exclusão!', 'warning');
    currentProdutoId = searchId.value;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    const formData = new FormData(form);
    const produto = {
        idproduto: searchId.value,
        nomeproduto: formData.get('nomeproduto'),
        quantidadeemestoque: parseInt(formData.get('quantidadeemestoque')),
        precounitario: parseFloat(formData.get('precounitario'))
    };

    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/produto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/produto/${currentProdutoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(produto)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/produto/${currentProdutoId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarProdutos();
        } else {
            const error = response ? await response.json() : {};
            mostrarMensagem(error.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro na operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// ---------- Listagem ----------
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE_URL}/produto`);
        if (response.ok) {
            const produtos = await response.json();
            renderizarTabelaProdutos(produtos);
        } else {
            throw new Error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de produtos', 'error');
    }
}

function renderizarTabelaProdutos(produtos) {
    produtosTableBody.innerHTML = '';
    produtos.forEach(produto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarProduto(${produto.idproduto})">
                    ${produto.idproduto}
                </button>
            </td>
            <td>${produto.nomeproduto}</td>
            <td>${produto.quantidadeemestoque}</td>
            <td>${produto.precounitario}</td>
        `;
        produtosTableBody.appendChild(row);
    });
}

async function selecionarProduto(id) {
    searchId.value = id;
    await buscarProduto();
}
