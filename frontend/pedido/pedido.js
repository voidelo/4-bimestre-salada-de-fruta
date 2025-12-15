// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
// Alterado para refletir o campo PK da tabela pedido
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

// Nomes dos campos do formulário (IDs esperados no HTML)
const INPUT_ID_DATADOPEDIDO = 'datadopedido';
const INPUT_ID_CLIENTECPF = 'clientepessoacpfpessoa';
const INPUT_ID_FUNCIONARIOCPF = 'funcionariopessoacpfpessoa';

// Carregar lista de pedidos ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPedidos();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPedido);
btnIncluir.addEventListener('click', incluirPedido);
btnAlterar.addEventListener('click', alterarPedido);
btnExcluir.addEventListener('click', excluirPedido);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false); // mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar)
bloquearCampos(false); // libera pk e bloqueia os demais campos

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 3000);
}

function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach((input, index) => {
        // Correção para ignorar o botão de busca que pode ser o primeiro elemento do form
        if (input.id === 'searchId') { 
            // Elemento de busca (PK)
            input.disabled = bloquearPrimeiro;
        } else {
            // Demais elementos (campos de dados)
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Função para limpar formulário
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

// Função para formatar data para exibição (DD/MM/YYYY)
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00'); 
    if (isNaN(data.getTime())) return dataString; 
    return data.toLocaleDateString('pt-BR');
}

// Função para preencher input de data com formato YYYY-MM-DD (necessário para inputs type="date")
function preencherInputData(dataString) {
    if (!dataString) return '';
    return dataString.split('T')[0];
}

// Função para buscar pedido por ID
async function buscarPedido() {
    const id = searchId.value.trim();
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        return;
    }
    // Não bloquear campos aqui, pois isso é feito em 'preencherFormulario' 
    // ou ao final da função, dependendo do resultado da busca.
    // bloquearCampos(false); // Removido daqui
    searchId.focus();
    try {
        const response = await fetch(`${API_BASE_URL}/pedido/${id}`);

        if (response.ok) {
            const pedido = await response.json();
            preencherFormulario(pedido);

            mostrarBotoes(true, false, true, true, false, false); 
            mostrarMensagem('Pedido encontrada!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false); 
            mostrarMensagem('Pedido não encontrada. Você pode incluir uma nova pedido.', 'info');
            // Aqui mantemos a PK liberada para a próxima ação (incluir)
            bloquearCampos(false); 
        } else {
            throw new Error('Erro ao buscar pedido');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pedido', 'error');
    }
}

// Função para preencher formulário com dados do pedido
function preencherFormulario(pedido) {
    // Atualiza currentPedidoId
    currentPedidoId = pedido.idpedido;
    searchId.value = pedido.idpedido;
    
    // CORREÇÃO: Adicionando checagem de existência do elemento antes de tentar atribuir valor
    const dataInput = document.getElementById(INPUT_ID_DATADOPEDIDO);
    if (dataInput) {
        dataInput.value = preencherInputData(pedido.datadopedido);
    } else {
        console.warn(`Elemento HTML com ID "${INPUT_ID_DATADOPEDIDO}" não encontrado.`);
    }

    const clienteInput = document.getElementById(INPUT_ID_CLIENTECPF);
    if (clienteInput) {
        clienteInput.value = pedido.clientepessoacpfpessoa || '';
    } else {
        console.warn(`Elemento HTML com ID "${INPUT_ID_CLIENTECPF}" não encontrado.`);
    }

    const funcionarioInput = document.getElementById(INPUT_ID_FUNCIONARIOCPF);
    if (funcionarioInput) {
        funcionarioInput.value = pedido.funcionariopessoacpfpessoa || '';
    } else {
        console.warn(`Elemento HTML com ID "${INPUT_ID_FUNCIONARIOCPF}" não encontrado.`);
    }

    // BLOQUEIA os campos de dados após o preenchimento (PK fica liberada)
    bloquearCampos(false); 
}

// Função para incluir pedido
async function incluirPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPedidoId = searchId.value;
    limparFormulario();
    searchId.value = currentPedidoId;
    bloquearCampos(true); // Bloqueia a PK (idpedido) e libera os demais campos

    mostrarBotoes(false, false, false, false, true, true); 
    // Tentativa de foco com checagem de segurança
    const dataInput = document.getElementById(INPUT_ID_DATADOPEDIDO);
    if (dataInput) {
        dataInput.focus();
    }
    operacao = 'incluir';
}

// Função para alterar pedido
async function alterarPedido() {
    mostrarMensagem('Digite os dados!', 'success');
    bloquearCampos(true); // Bloqueia a PK (idpedido) e libera os demais campos
    mostrarBotoes(false, false, false, false, true, true);
    // Tentativa de foco com checagem de segurança
    const dataInput = document.getElementById(INPUT_ID_DATADOPEDIDO);
    if (dataInput) {
        dataInput.focus();
    }
    operacao = 'alterar';
}

// ... (Código anterior)

// Função para excluir pedido
async function excluirPedido() {
    mostrarMensagem('Preparando exclusão...', 'info');
    currentPedidoId = searchId.value;

    // Ação: Limpar e desabilitar todos os campos, exceto o de busca
    limparFormulario();
    searchId.value = currentPedidoId; // Mantém o ID na tela
    
    // Desabilita todos os campos para exclusão
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => input.disabled = true);
    searchId.disabled = true; // Desabilita também o campo de busca
    
    // Se o backend precisa de confirmação, é aqui que deve ser tratado.
    
    mostrarBotoes(false, false, false, false, true, true); // Mostrar Salvar e Cancelar
    operacao = 'excluir';
}

async function salvarOperacao() {
    console.log('Operação:', operacao + ' - currentPedidoId: ' + currentPedidoId + ' - searchId: ' + searchId.value);

    // Ajuste: Apenas cria o objeto 'pedido' se a operação NÃO for exclusão.
    // A exclusão só precisa do ID na URL.
    let pedido = null;
    if (operacao !== 'excluir') {
        const formData = new FormData(form);
        pedido = {
            idpedido: parseInt(searchId.value), 
            datadopedido: formData.get(INPUT_ID_DATADOPEDIDO),
            clientepessoacpfpessoa: formData.get(INPUT_ID_CLIENTECPF),
            funcionariopessoacpfpessoa: formData.get(INPUT_ID_FUNCIONARIOCPF)
        };
    }

    let response = null;
    let url = `${API_BASE_URL}/pedido`;
    let method = '';
    
    try {
        // ... (lógica de definição de method e url)

        if (operacao === 'incluir') {
            method = 'POST';
        } else if (operacao === 'alterar') {
            method = 'PUT';
            url = `${API_BASE_URL}/pedido/${currentPedidoId}`;
        } else if (operacao === 'excluir') {
            method = 'DELETE';
            url = `${API_BASE_URL}/pedido/${currentPedidoId}`;
        } else {
            return;
        }

        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Envia o corpo apenas se NÃO for exclusão
        if (operacao !== 'excluir') {
            config.body = JSON.stringify(pedido);
        }

        response = await fetch(url, config);

        if (response.ok) {
            // ... (resto da lógica de sucesso)
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarPedidos();
        } else {
            // ... (resto da lógica de erro)
            if (response.status === 400 && operacao === 'excluir') {
                mostrarMensagem('Erro 400: Pedido não pode ser excluído. Pode haver dados dependentes (Chave Estrangeira).', 'error');
            } else if (operacao !== 'excluir' && response.headers.get('content-type')?.includes('application/json')) {
                const error = await response.json();
                mostrarMensagem(error.error || `Erro ao ${operacao} pedido`, 'error');
            } else {
                mostrarMensagem(`Erro ao ${operacao} pedido. Status: ${response.status}`, 'error');
            }
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro de comunicação com a API', 'error');
    }

    // Restaura o estado inicial
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false); 
    document.getElementById('searchId').focus();
}

// ... (Resto do código sem alterações)
// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    document.getElementById('searchId').focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pedidos
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

// Função para renderizar tabela de pedidos
function renderizarTabelaPedidos(pedidos) {
    pedidosTableBody.innerHTML = '';

    pedidos.forEach(pedido => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPedido(${pedido.idpedido})">
                    ${pedido.idpedido}
                </button>
            </td>
            <td>${formatarData(pedido.datadopedido)}</td>
            <td>${pedido.clientepessoacpfpessoa || ''}</td>
            <td>${pedido.funcionariopessoacpfpessoa || ''}</td>
        `;
        pedidosTableBody.appendChild(row);
    });
}

// Função para selecionar pedido da tabela
async function selecionarPedido(id) {
    searchId.value = id;
    await buscarPedido();
}