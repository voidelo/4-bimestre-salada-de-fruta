// Configuração da API, IP e porta.
const API_BASE_URL = 'http://localhost:3001';
let currentPersonId = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchCpf = document.getElementById('searchCpf');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Carregar lista de pessoas ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarPessoas();
});

// Event Listeners
btnBuscar.addEventListener('click', buscarPessoa);
btnIncluir.addEventListener('click', incluirPessoa);
btnAlterar.addEventListener('click', alterarPessoa);
btnExcluir.addEventListener('click', excluirPessoa);
btnCancelar.addEventListener('click', cancelarOperacao);
btnSalvar.addEventListener('click', salvarOperacao);

mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

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
        if (index === 0) {
            input.disabled = bloquearPrimeiro;
        } else {
            input.disabled = !bloquearPrimeiro;
        }
    });
}

// Limpar formulário
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

// Função para formatar data (ISO → BR)
function formatarData(dataString) {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Converter BR → ISO
function converterDataParaISO(dataString) {
    if (!dataString) return null;
    const partes = dataString.split('/');
    if (partes.length === 3) {
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    return dataString;
}

// Buscar pessoa por CPF
async function buscarPessoa() {
    const cpf = searchCpf.value.trim();
    if (!cpf) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }
    bloquearCampos(false);
    searchCpf.focus();

    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${cpf}`);

        if (response.ok) {
            const pessoa = await response.json();
            preencherFormulario(pessoa);

            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');

        } else if (response.status === 404) {
            limparFormulario();
            searchCpf.value = cpf;
            mostrarBotoes(true, true, false, false, false, false);
            mostrarMensagem('Pessoa não encontrada. Você pode incluir uma nova pessoa.', 'info');
            bloquearCampos(false);
        } else {
            throw new Error('Erro ao buscar pessoa');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao buscar pessoa', 'error');
    }
}

// Preenche o formulário
function preencherFormulario(pessoa) {
    currentPersonId = pessoa.cpfpessoa;
    searchCpf.value = pessoa.cpfpessoa;
    document.getElementById('nomePessoa').value = pessoa.nomepessoa || '';
    document.getElementById('dataNascimentoPessoa').value = pessoa.datanascimentopessoa ? pessoa.datanascimentopessoa.split('T')[0] : '';
    document.getElementById('enderecoIdEndereco').value = pessoa.enderecoidendereco || '';
}

// Incluir pessoa
function incluirPessoa() {
    mostrarMensagem('Digite os dados!', 'success');
    currentPersonId = searchCpf.value;
    limparFormulario();
    searchCpf.value = currentPersonId;
    bloquearCampos(true);

    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nomePessoa').focus();
    operacao = 'incluir';
}

// Alterar pessoa
function alterarPessoa() {
    mostrarMensagem('Altere os dados desejados!', 'success');
    bloquearCampos(true);
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nomePessoa').focus();
    operacao = 'alterar';
}

// Excluir pessoa
function excluirPessoa() {
    mostrarMensagem('Confirmar exclusão?', 'info');
    currentPersonId = searchCpf.value;
    searchCpf.disabled = true;
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Salvar (incluir / alterar / excluir)
async function salvarOperacao() {
    const formData = new FormData(form);
    const pessoa = {
        cpfpessoa: searchCpf.value,
        nomepessoa: formData.get('nomePessoa'),
        datanascimentopessoa: formData.get('dataNascimentoPessoa'),
        enderecoidendereco: parseInt(formData.get('enderecoIdEndereco')) || null
    };

    let response;
    try {
        if (operacao === 'incluir') {
            response = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'alterar') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoa)
            });
        } else if (operacao === 'excluir') {
            response = await fetch(`${API_BASE_URL}/pessoa/${currentPersonId}`, {
                method: 'DELETE'
            });
        }

        if (response.ok) {
            mostrarMensagem(`Operação ${operacao} realizada com sucesso!`, 'success');
            limparFormulario();
            carregarPessoas();
        } else {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro na operação', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao salvar operação', 'error');
    }

    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchCpf.focus();
}

// Cancelar
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchCpf.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa`);
        if (response.ok) {
            const pessoas = await response.json();
            renderizarTabelaPessoas(pessoas);
        } else {
            throw new Error('Erro ao carregar pessoas');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar lista de pessoas', 'error');
    }
}

// Renderizar tabela
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPessoa('${pessoa.cpfpessoa}')">
                    ${pessoa.cpfpessoa}
                </button>
            </td>
            <td>${pessoa.nomepessoa}</td>
            <td>${formatarData(pessoa.datanascimentopessoa)}</td>
            <td>${pessoa.enderecoidendereco ?? ''}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}

// Selecionar pessoa na tabela
async function selecionarPessoa(cpf) {
    searchCpf.value = cpf;
    await buscarPessoa();
}
