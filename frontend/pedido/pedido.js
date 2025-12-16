// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentPedidoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pedidoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pedidosTableBody = document.getElementById('pedidosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Permitir buscar com Enter
searchId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscarPedido();
    }
});

// ---------- Funções utilitárias ----------
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => messageContainer.innerHTML = '', 4000);
}

function bloquearCampos(habilitar) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id === 'searchId') {
            input.disabled = (operacao === 'alterar' || operacao === 'excluir');
        } else {
            input.disabled = !habilitar;
        }
    });
}

function limparFormulario() {
    form.reset();
    currentPedidoId = null;
}

function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para formatar data para o input (YYYY-MM-DD)
function formatarDataInput(dataString) {
    if (!dataString) return '';
    return dataString.split('T')[0];
}

// Função para formatar data para exibição (DD/MM/YYYY)
function formatarDataExibicao(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00');
    if (isNaN(data.getTime())) return dataString;
    return data.toLocaleDateString('pt-BR');
}

// ---------- CRUD ----------
async function buscarPedido() {
    const id = searchId.value.trim();
    
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        searchId.focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);
        
        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);
            mostrarBotoes(true, false, true, true, false, false);
            bloquearCampos(false);
            mostrarMensagem('Pedido encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            bloquearCampos(false);
            mostrarMensagem('Pedido não encontrado. Você pode incluir um novo.', 'info');
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pedido', 'error');
    }
}

function preencherFormulario(pedido) {
    currentPedidoId = pedido.idpedido;
    searchId.value = pedido.idpedido;
    
    // Preenche a data no formato correto para o input type="date"
    document.getElementById('datadoPedido').value = formatarDataInput(pedido.datadopedido) || '';
    document.getElementById('clientepessoacpfpessoa').value = pedido.clientepessoacpfpessoa || '';
    document.getElementById('funcionariopessoacpfpessoa').value = pedido.funcionariopessoacpfpessoa || '';
}

function incluirPedido() {
    const id = searchId.value.trim();
    
    if (!id) {
        mostrarMensagem('Digite um ID antes de incluir', 'warning');
        searchId.focus();
        return;
    }
    
    mostrarMensagem('Preencha os dados do pedido!', 'info');
    currentPedidoId = id;
    
    // Limpa apenas os campos, mantém o ID
    document.getElementById('datadoPedido').value = '';
    document.getElementById('clientepessoacpfpessoa').value = '';
    document.getElementById('funcionariopessoacpfpessoa').value = '';
    
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('datadoPedido').focus();
    operacao = 'incluir';
}

function alterarPedido() {
    if (!currentPedidoId) {
        mostrarMensagem('Busque um pedido primeiro', 'warning');
        return;
    }
    
    mostrarMensagem('Altere os dados do pedido!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('datadoPedido').focus();
    operacao = 'alterar';
}

function excluirPedido() {
    if (!currentPedidoId) {
        mostrarMensagem('Busque um pedido primeiro', 'warning');
        return;
    }
    
    mostrarMensagem('Clique em SALVAR para confirmar a exclusão!', 'warning');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

async function salvarOperacao() {
    if (!operacao) {
        mostrarMensagem('Nenhuma operação em andamento', 'warning');
        return;
    }

    const formData = new FormData(form);
    const pedido = {
        idpedido: parseInt(searchId.value.trim()),
        datadopedido: formData.get('datadoPedido'),
        clientepessoacpfpessoa: formData.get('clientepessoacpfpessoa')?.trim(),
        funcionariopessoacpfpessoa: formData.get('funcionariopessoacpfpessoa')?.trim()
    };

    // Validações
    if (operacao !== 'excluir') {
        if (!pedido.datadopedido) {
            mostrarMensagem('Data do pedido é obrigatória', 'warning');
            document.getElementById('datadoPedido').focus();
            return;
        }
        
        if (!pedido.clientepessoacpfpessoa) {
            mostrarMensagem('CPF do cliente é obrigatório', 'warning');
            document.getElementById('clientepessoacpfpessoa').focus();
            return;
        }
        
        if (!pedido.funcionariopessoacpfpessoa) {
            mostrarMensagem('CPF do funcionário é obrigatório', 'warning');
            document.getElementById('funcionariopessoacpfpessoa').focus();
            return;
        }
        
        if (isNaN(pedido.idpedido)) {
            mostrarMensagem('ID inválido', 'warning');
            searchId.focus();
            return;
        }
    }

    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pedido`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pedido)
            });
        } else if (operacao === 'excluir') {
            if (!currentPedidoId) {
                mostrarMensagem('ID do pedido inválido', 'error');
                return;
            }
            response = await fetch(`${API_BASE_URL}/pedido/${currentPedidoId}`, { 
                method: 'DELETE' 
            });
        }

        if (response && response.ok) {
            const mensagem = operacao === 'incluir' ? 'Pedido incluído com sucesso!' :
                           operacao === 'alterar' ? 'Pedido alterado com sucesso!' :
                           'Pedido excluído com sucesso!';
            
            mostrarMensagem(mensagem, 'success');
            limparFormulario();
            await carregarPedidos();
            
        } else {
            const error = response ? await response.json() : {};
            
            // Tratamento específico para erros conhecidos
            if (response && response.status === 409) {
                if (error.tipo === 'PEDIDO_COM_PRODUTOS') {
                    mostrarMensagem('❌ ' + error.error, 'error');
                } else if (error.tipo === 'ID_DUPLICADO') {
                    mostrarMensagem('❌ ' + error.error, 'error');
                } else {
                    mostrarMensagem('❌ ' + (error.error || 'Conflito na operação'), 'error');
                }
            } else if (response && response.status === 400 && error.tipo === 'FK_INVALIDA') {
                mostrarMensagem('❌ ' + error.error, 'error');
            } else {
                mostrarMensagem('❌ ' + (error.error || 'Erro na operação'), 'error');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('❌ Erro ao conectar com o servidor', 'error');
    }

    // Resetar estado
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    operacao = null;
    currentPedidoId = null;
    searchId.focus();
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    currentPedidoId = null;
    operacao = null;
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// ---------- Listagem ----------
async function carregarPedidos() {
    try {
        const response = await fetch(`${API_BASE_URL}/pedido`);
        if (response.ok) {
            const pedidos = await response.json();
            renderizarTabelaPedidos(pedidos);
        } else {
            throw new Error('Erro ao carregar pedidos');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pedidos', 'error');
    }
}

function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';
    
    if (pedidos.length === 0) {
        pedidosTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #666;">
                    Nenhum pedido cadastrado
                </td>
            </tr>
        `;
        return;
    }
    
    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPedido(${pedido.idpedido})">
                    ${pedido.idpedido}
                </button>
            </td>
            <td>${formatarDataExibicao(pedido.datadopedido)}</td>
            <td>${pedido.clientepessoacpfpessoa || ''}</td>
            <td>${pedido.funcionariopessoacpfpessoa || ''}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}