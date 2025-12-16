// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentEnderecoId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('enderecoForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const enderecosTableBody = document.getElementById('enderecosTableBody');
const messageContainer = document.getElementById('messageContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEnderecos();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarEndereco);
btnIncluir.addEventListener('click', incluirEndereco);
btnAlterar.addEventListener('click', alterarEndereco);
btnExcluir.addEventListener('click', excluirEndereco);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

// Permitir buscar com Enter
searchId.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        buscarEndereco();
    }
});

// Máscara para CEP
document.getElementById('cep').addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 5) {
        valor = valor.substring(0, 5) + '-' + valor.substring(5, 8);
    }
    e.target.value = valor;
});

// ---------- Funções utilitárias ----------
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => messageContainer.innerHTML = '', 4000);
}

function bloquearCampos(habilitar) {
    const inputs = form.querySelectorAll('input');
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
    currentEnderecoId = null;
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
async function buscarEndereco() {
    const id = searchId.value.trim();
    
    if (!id) {
        mostrarMensagem('Digite um ID para buscar', 'warning');
        searchId.focus();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/endereco/${id}`);
        
        if (response.ok) {
            const endereco = await response.json();
            preencherFormulario(endereco);
            mostrarBotoes(true, false, true, true, false, false);
            bloquearCampos(false);
            mostrarMensagem('Endereço encontrado!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = id;
            mostrarBotoes(true, true, false, false, false, false);
            bloquearCampos(false);
            mostrarMensagem('Endereço não encontrado. Você pode incluir um novo.', 'info');
        } else {
            throw new Error('Erro ao buscar endereço');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar endereço', 'error');
    }
}

function preencherFormulario(endereco) {
    currentEnderecoId = endereco.idendereco;
    searchId.value = endereco.idendereco;
    document.getElementById('logradouro').value = endereco.logradouro || '';
    document.getElementById('numero').value = endereco.numero || '';
    document.getElementById('referencia').value = endereco.referencia || '';
    document.getElementById('cep').value = endereco.cep || '';
    document.getElementById('cidadeidcidade').value = endereco.cidadeidcidade || '';
}

function incluirEndereco() {
    const id = searchId.value.trim();
    
    if (!id) {
        mostrarMensagem('Digite um ID antes de incluir', 'warning');
        searchId.focus();
        return;
    }
    
    mostrarMensagem('Preencha os dados do endereço!', 'info');
    currentEnderecoId = id;
    
    // Limpa apenas os campos, mantém o ID
    document.getElementById('logradouro').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('referencia').value = '';
    document.getElementById('cep').value = '';
    document.getElementById('cidadeidcidade').value = '';
    
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('logradouro').focus();
    operacao = 'incluir';
}

function alterarEndereco() {
    if (!currentEnderecoId) {
        mostrarMensagem('Busque um endereço primeiro', 'warning');
        return;
    }
    
    mostrarMensagem('Altere os dados do endereço!', 'info');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('logradouro').focus();
    operacao = 'alterar';
}

function excluirEndereco() {
    if (!currentEnderecoId) {
        mostrarMensagem('Busque um endereço primeiro', 'warning');
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
    const endereco = {
        idendereco: parseInt(searchId.value.trim()),
        logradouro: formData.get('logradouro')?.trim(),
        numero: formData.get('numero')?.trim(),
        referencia: formData.get('referencia')?.trim(),
        cep: formData.get('cep')?.trim(),
        cidadeidcidade: parseInt(formData.get('cidadeidcidade'))
    };

    // Validações
    if (operacao !== 'excluir') {
        if (!endereco.logradouro) {
            mostrarMensagem('Logradouro é obrigatório', 'warning');
            document.getElementById('logradouro').focus();
            return;
        }
        
        if (!endereco.cep) {
            mostrarMensagem('CEP é obrigatório', 'warning');
            document.getElementById('cep').focus();
            return;
        }
        
        if (isNaN(endereco.cidadeidcidade)) {
            mostrarMensagem('ID da cidade é obrigatório', 'warning');
            document.getElementById('cidadeidcidade').focus();
            return;
        }
        
        if (isNaN(endereco.idendereco)) {
            mostrarMensagem('ID inválido', 'warning');
            searchId.focus();
            return;
        }
    }

    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/endereco`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endereco)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/endereco/${currentEnderecoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endereco)
            });
        } else if (operacao === 'excluir') {
            if (!currentEnderecoId) {
                mostrarMensagem('ID do endereço inválido', 'error');
                return;
            }
            response = await fetch(`${API_BASE_URL}/endereco/${currentEnderecoId}`, { 
                method: 'DELETE' 
            });
        }

        if (response && response.ok) {
            const mensagem = operacao === 'incluir' ? 'Endereço incluído com sucesso!' :
                           operacao === 'alterar' ? 'Endereço alterado com sucesso!' :
                           'Endereço excluído com sucesso!';
            
            mostrarMensagem(mensagem, 'success');
            limparFormulario();
            await carregarEnderecos();
            
        } else {
            const error = response ? await response.json() : {};
            
            // Tratamento específico para erros conhecidos
            if (response && response.status === 409) {
                if (error.tipo === 'ENDERECO_EM_USO') {
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
    currentEnderecoId = null;
    searchId.focus();
}

function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    currentEnderecoId = null;
    operacao = null;
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// ---------- Listagem ----------
async function carregarEnderecos() {
    try {
        const response = await fetch(`${API_BASE_URL}/endereco`);
        if (response.ok) {
            const enderecos = await response.json();
            renderizarTabelaEnderecos(enderecos);
        } else {
            throw new Error('Erro ao carregar endereços');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de endereços', 'error');
    }
}

function renderizarTabelaEnderecos(enderecos) {
    enderecosTableBody.innerHTML = '';
    
    if (enderecos.length === 0) {
        enderecosTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px; color: #666;">
                    Nenhum endereço cadastrado
                </td>
            </tr>
        `;
        return;
    }
    
    enderecos.forEach(endereco => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarEndereco(${endereco.idendereco})">
                    ${endereco.idendereco}
                </button>
            </td>
            <td>${endereco.logradouro || ''}</td>
            <td>${endereco.numero || ''}</td>
            <td>${endereco.referencia || ''}</td>
            <td>${endereco.cep || ''}</td>
            <td style="text-align: center;">${endereco.cidadeidcidade || ''}</td>
        `;
        enderecosTableBody.appendChild(row);
    });
}

async function selecionarEndereco(id) {
    searchId.value = id;
    await buscarEndereco();
}