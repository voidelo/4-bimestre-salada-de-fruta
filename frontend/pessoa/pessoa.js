// Configuração da API
const API_BASE_URL = 'http://localhost:3001';
let currentPersonCpfpessoa = null;
let operacao = null;

// Elementos do DOM
const form = document.getElementById('pessoaForm');
const searchId = document.getElementById('searchId');
const btnBuscar = document.getElementById('btnBuscar');
const btnIncluir = document.getElementById('btnIncluir');
const btnAlterar = document.getElementById('btnAlterar');
const btnExcluir = document.getElementById('btnExcluir');
const btnCancelar = document.getElementById('btnCancelar');
const btnSalvar = document.getElementById('btnSalvar');
const pessoasTableBody = document.getElementById('pessoasTableBody');
const messageContainer = document.getElementById('messageContainer');

// Elementos específicos
let checkboxFuncionario, checkboxCliente, funcionarioFields, clienteFields;
let salarioInput, porcentagemComissaoInput, cargoSelect, rendaClienteInput;
let cpfpessoaInput, dataNascimentoInput, enderecoSelect;

// Carregar dados ao inicializar
document.addEventListener('DOMContentLoaded', () => {
    checkboxFuncionario = document.getElementById('checkboxFuncionario');
    checkboxCliente = document.getElementById('checkboxCliente');
    funcionarioFields = document.getElementById('funcionarioFields');
    clienteFields = document.getElementById('clienteFields');
    salarioInput = document.getElementById('salario');
    porcentagemComissaoInput = document.getElementById('porcentagem_comissao');
    cargoSelect = document.getElementById('id_cargo');
    rendaClienteInput = document.getElementById('renda_cliente');
    cpfpessoaInput = document.getElementById('cpf_pessoa');
    dataNascimentoInput = document.getElementById('data_nascimento_pessoa');
    enderecoSelect = document.getElementById('endereco_id_endereco');
    
    carregarPessoas();
    carregarCargos();
    carregarEnderecos();
    configurarEventListeners();
});

// Configurar event listeners
function configurarEventListeners() {
    btnBuscar.addEventListener('click', buscarPessoa);
    btnIncluir.addEventListener('click', incluirPessoa);
    btnAlterar.addEventListener('click', alterarPessoa);
    btnExcluir.addEventListener('click', excluirPessoa);
    btnCancelar.addEventListener('click', cancelarOperacao);
    btnSalvar.addEventListener('click', salvarOperacao);

    checkboxFuncionario.addEventListener('change', function() {
        if (this.checked) {
            funcionarioFields.style.display = 'block';
            salarioInput.required = true;
            porcentagemComissaoInput.required = true;
            cargoSelect.required = true;
        } else {
            funcionarioFields.style.display = 'none';
            salarioInput.required = false;
            porcentagemComissaoInput.required = false;
            cargoSelect.required = false;
            salarioInput.value = '';
            porcentagemComissaoInput.value = '';
            cargoSelect.value = '';
        }
    });

    checkboxCliente.addEventListener('change', function() {
        if (this.checked) {
            clienteFields.style.display = 'block';
            rendaClienteInput.required = true;
        } else {
            clienteFields.style.display = 'none';
            rendaClienteInput.required = false;
            rendaClienteInput.value = '';
        }
    });

    const formatarCPF = (input) => {
        input.addEventListener('input', () => {
            let value = input.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            input.value = value;
        });
    };

    formatarCPF(searchId);
    formatarCPF(cpfpessoaInput);
}

// Configuração inicial dos botões
mostrarBotoes(true, false, false, false, false, false);
bloquearCampos(false);

// Função para mostrar mensagens
function mostrarMensagem(texto, tipo = 'info') {
    messageContainer.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 4000);
}

// Função para bloquear/desbloquear campos
// Função para bloquear/desbloquear campos
function bloquearCampos(bloquearPrimeiro) {
    const inputs = form.querySelectorAll('input:not(#searchId), select');
    inputs.forEach((input) => {
        input.disabled = !bloquearPrimeiro;
    });
    
    if (cpfpessoaInput && bloquearPrimeiro) {
        cpfpessoaInput.disabled = true;
    }
    
    searchId.disabled = false;
    
    // SEMPRE deixar os checkboxes habilitados durante alteração ou inclusão
    if (bloquearPrimeiro && (operacao === 'alterar' || operacao === 'incluir')) {
        checkboxFuncionario.disabled = false;
        checkboxCliente.disabled = false;
    }
}

// Função para limpar formulário
function limparFormulario() {
    form.reset();
    currentPersonCpfpessoa = null;
    funcionarioFields.style.display = 'none';
    clienteFields.style.display = 'none';
    salarioInput.required = false;
    porcentagemComissaoInput.required = false;
    cargoSelect.required = false;
    rendaClienteInput.required = false;
    operacao = null;
}

// Função para mostrar/ocultar botões
function mostrarBotoes(btBuscar, btIncluir, btAlterar, btExcluir, btSalvar, btCancelar) {
    btnBuscar.style.display = btBuscar ? 'inline-block' : 'none';
    btnIncluir.style.display = btIncluir ? 'inline-block' : 'none';
    btnAlterar.style.display = btAlterar ? 'inline-block' : 'none';
    btnExcluir.style.display = btExcluir ? 'inline-block' : 'none';
    btnSalvar.style.display = btSalvar ? 'inline-block' : 'none';
    btnCancelar.style.display = btCancelar ? 'inline-block' : 'none';
}

// Função para carregar cargos
async function carregarCargos() {
    try {
        const response = await fetch(`${API_BASE_URL}/cargo`);
        if (!response.ok) throw new Error('Erro ao carregar cargos');

        const cargos = await response.json();
        cargoSelect.innerHTML = '<option value="">Selecione um cargo</option>';

        cargos.forEach(cargo => {
            const option = document.createElement('option');
            option.value = cargo.idcargo;
            option.textContent = cargo.nomecargo;
            cargoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar cargos:', error);
        mostrarMensagem('Erro ao carregar cargos', 'error');
    }
}

// Função para carregar endereços
async function carregarEnderecos() {
    try {
        const response = await fetch(`${API_BASE_URL}/endereco`);
        if (!response.ok) {
            console.warn('Endpoint /endereco não disponível');
            enderecoSelect.innerHTML = '<option value="">Nenhum endereço disponível</option>';
            return;
        }

        const enderecos = await response.json();
        enderecoSelect.innerHTML = '<option value="">Selecione um endereço</option>';

        enderecos.forEach(endereco => {
            const option = document.createElement('option');
            option.value = endereco.idendereco;
            // Formato: Logradouro, Número - Referência - CEP
            let textoEndereco = `${endereco.logradouro}, ${endereco.numero}`;
            if (endereco.referencia) {
                textoEndereco += ` - ${endereco.referencia}`;
            }
            textoEndereco += ` - CEP: ${endereco.cep}`;
            option.textContent = textoEndereco;
            enderecoSelect.appendChild(option);
        });
    } catch (error) {
        console.warn('Erro ao carregar endereços:', error);
        enderecoSelect.innerHTML = '<option value="">Nenhum endereço disponível</option>';
    }
}

// Função para buscar pessoa por CPF
async function buscarPessoa() {
    const cpfpessoa = searchId.value.trim();
    if (!cpfpessoa) {
        mostrarMensagem('Digite um CPF para buscar', 'warning');
        return;
    }
    if (cpfpessoa.length !== 11) {
        mostrarMensagem('O CPF deve conter 11 dígitos.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/${cpfpessoa}`);

        if (response.ok) {
            const pessoa = await response.json();
            await preencherFormulario(pessoa);
            bloquearCampos(false);
            mostrarBotoes(true, false, true, true, false, false);
            mostrarMensagem('Pessoa encontrada!', 'success');
        } else if (response.status === 404) {
            limparFormulario();
            searchId.value = cpfpessoa;
            cpfpessoaInput.value = cpfpessoa;
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

// Função para preencher formulário com dados da pessoa
async function preencherFormulario(pessoa) {
    currentPersonCpfpessoa = pessoa.cpfpessoa;
    searchId.value = pessoa.cpfpessoa;
    document.getElementById('nome_pessoa').value = pessoa.nomepessoa || '';
    cpfpessoaInput.value = pessoa.cpfpessoa || '';
    
    if (pessoa.datanascimentopessoa) {
        dataNascimentoInput.value = pessoa.datanascimentopessoa.split('T')[0];
    }
    
    if (pessoa.enderecoidendereco) {
        enderecoSelect.value = pessoa.enderecoidendereco;
    }

    // Limpar campos antes de preencher
    checkboxFuncionario.checked = false;
    funcionarioFields.style.display = 'none';
    salarioInput.value = '';
    porcentagemComissaoInput.value = '';
    cargoSelect.value = '';
    salarioInput.required = false;
    porcentagemComissaoInput.required = false;
    cargoSelect.required = false;

    checkboxCliente.checked = false;
    clienteFields.style.display = 'none';
    rendaClienteInput.value = '';
    rendaClienteInput.required = false;

    // Verificar se é funcionário
    try {
        const funcionarioResponse = await fetch(`${API_BASE_URL}/funcionario/pessoa/${pessoa.cpfpessoa}`);
        if (funcionarioResponse.ok) {
            const funcionario = await funcionarioResponse.json();
            console.log('Dados do funcionário recebidos:', funcionario);
            
            checkboxFuncionario.checked = true;
            funcionarioFields.style.display = 'block';
            
            // Tenta diferentes propriedades do retorno
            salarioInput.value = funcionario.salario || '';
            porcentagemComissaoInput.value = funcionario.porcentagemcomissao || funcionario.porcentagem_comissao || '';
            cargoSelect.value = funcionario.cargosidcargo || funcionario.cargoidcargo || funcionario.idcargo || '';
            
            salarioInput.required = true;
            porcentagemComissaoInput.required = true;
            cargoSelect.required = true;
        }
    } catch (error) {
        console.warn('Não é funcionário ou erro ao verificar:', error);
    }

    // Verificar se é cliente
    try {
        const clienteResponse = await fetch(`${API_BASE_URL}/cliente/pessoa/${pessoa.cpfpessoa}`);
        if (clienteResponse.ok) {
            const cliente = await clienteResponse.json();
            console.log('Dados do cliente recebidos:', cliente);
            
            checkboxCliente.checked = true;
            clienteFields.style.display = 'block';
            rendaClienteInput.value = cliente.rendacliente || cliente.renda_cliente || '';
            rendaClienteInput.required = true;
        }
    } catch (error) {
        console.warn('Não é cliente ou erro ao verificar:', error);
    }
}

// Função para incluir pessoa
// Função para incluir pessoa
function incluirPessoa() {
    const cpfpessoa = searchId.value.trim();
    if (!cpfpessoa || cpfpessoa.length !== 11) {
        mostrarMensagem('Digite um CPF válido antes de incluir', 'warning');
        return;
    }
    
    mostrarMensagem('Digite os dados da nova pessoa!', 'info');
    currentPersonCpfpessoa = cpfpessoa;
    limparFormulario();
    searchId.value = cpfpessoa;
    cpfpessoaInput.value = cpfpessoa;
    operacao = 'incluir';
    bloquearCampos(true);
    
    // Garantir que os checkboxes fiquem habilitados
    checkboxFuncionario.disabled = false;
    checkboxCliente.disabled = false;
    
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
}
// Função para alterar pessoa
// Função para alterar pessoa
function alterarPessoa() {
    if (!currentPersonCpfpessoa) {
        mostrarMensagem('Nenhuma pessoa selecionada', 'warning');
        return;
    }
    
    mostrarMensagem('Altere os dados da pessoa!', 'info');
    operacao = 'alterar';
    bloquearCampos(true);
    
    // Garantir que os checkboxes fiquem habilitados
    checkboxFuncionario.disabled = false;
    checkboxCliente.disabled = false;
    
    mostrarBotoes(false, false, false, false, true, true);
    document.getElementById('nome_pessoa').focus();
}

// Função para excluir pessoa
function excluirPessoa() {
    if (!currentPersonCpfpessoa) {
        mostrarMensagem('Nenhuma pessoa selecionada', 'warning');
        return;
    }
    
    mostrarMensagem('Confirme a exclusão clicando em Salvar', 'warning');
    bloquearCampos(false);
    mostrarBotoes(false, false, false, false, true, true);
    operacao = 'excluir';
}

// Função para excluir associações
async function excluirAssociacoes(cpfpessoa) {
    const resultados = {
        funcionario: false,
        cliente: false,
        erros: []
    };

    try {
        const funcResponse = await fetch(`${API_BASE_URL}/funcionario/${cpfpessoa}`, {
            method: 'DELETE'
        });
        
        if (funcResponse.ok || funcResponse.status === 204 || funcResponse.status === 404) {
            resultados.funcionario = true;
        } else {
            const errorData = await funcResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            resultados.erros.push(`Funcionário: ${errorData.error || funcResponse.statusText}`);
        }
    } catch (error) {
        console.error(`Erro ao excluir funcionário:`, error);
        resultados.erros.push(`Funcionário: ${error.message}`);
    }

    try {
        const clienteResponse = await fetch(`${API_BASE_URL}/cliente/${cpfpessoa}`, {
            method: 'DELETE'
        });
        
        if (clienteResponse.ok || clienteResponse.status === 204 || clienteResponse.status === 404) {
            resultados.cliente = true;
        } else {
            const errorData = await clienteResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
            resultados.erros.push(`Cliente: ${errorData.error || clienteResponse.statusText}`);
        }
    } catch (error) {
        console.error(`Erro ao excluir cliente:`, error);
        resultados.erros.push(`Cliente: ${error.message}`);
    }

    return resultados;
}

// Função salvarOperacao
// Função salvarOperacao
async function salvarOperacao() {
    try {
        if (operacao === 'excluir') {
            if (!currentPersonCpfpessoa) {
                mostrarMensagem('Nenhuma pessoa selecionada para exclusão!', 'error');
                return;
            }

            const resultadosAssociacoes = await excluirAssociacoes(currentPersonCpfpessoa);
            
            if (resultadosAssociacoes.erros.length > 0) {
                console.warn('Avisos ao excluir associações:', resultadosAssociacoes.erros);
            }

            const responsePessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonCpfpessoa}`, {
                method: 'DELETE'
            });

            if (responsePessoa.ok || responsePessoa.status === 204) {
                mostrarMensagem('Pessoa excluída com sucesso!', 'success');
                limparFormulario();
                await carregarPessoas();
                mostrarBotoes(true, false, false, false, false, false);
                bloquearCampos(false);
                searchId.focus();
                return;
            } else {
                const error = await responsePessoa.json().catch(() => ({ error: 'Erro desconhecido' }));
                throw new Error(error.error || `Erro HTTP ${responsePessoa.status}`);
            }
        }

        // Coletar dados diretamente dos campos, não do FormData
        const pessoaData = {
            nomepessoa: document.getElementById('nome_pessoa').value.trim(),
            cpfpessoa: cpfpessoaInput.value.trim(),
            datanascimentopessoa: dataNascimentoInput.value || null,
            enderecoidendereco: enderecoSelect.value || null
        };

        console.log('Dados da pessoa a serem salvos:', pessoaData);

        if (!pessoaData.nomepessoa || !pessoaData.cpfpessoa) {
            mostrarMensagem('Preencha nome e CPF!', 'warning');
            return;
        }

        if (pessoaData.cpfpessoa.length !== 11) {
            mostrarMensagem('O CPF deve conter 11 dígitos.', 'warning');
            return;
        }

        // Validar campos de funcionário se checkbox estiver marcado
        if (checkboxFuncionario.checked) {
            const salario = salarioInput.value.trim();
            const comissao = porcentagemComissaoInput.value.trim();
            const cargo = cargoSelect.value;

            if (!salario || !comissao || !cargo) {
                mostrarMensagem('Preencha salário, comissão e cargo para funcionários!', 'warning');
                return;
            }
        }

        // Validar campos de cliente se checkbox estiver marcado
        if (checkboxCliente.checked) {
            const renda = rendaClienteInput.value.trim();
            if (!renda) {
                mostrarMensagem('Preencha a renda para clientes!', 'warning');
                return;
            }
        }

        let responsePessoa;
        
        if (operacao === 'incluir') {
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoaData)
            });
        } else if (operacao === 'alterar') {
            responsePessoa = await fetch(`${API_BASE_URL}/pessoa/${currentPersonCpfpessoa}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pessoaData)
            });
        }

        if (!responsePessoa.ok) {
            const error = await responsePessoa.json();
            mostrarMensagem(error.error || `Erro ao ${operacao} pessoa`, 'error');
            return;
        }

        // Gerenciar funcionário
        const isFuncionarioChecked = checkboxFuncionario.checked;
        const funcionarioExists = await verificarExistencia(`${API_BASE_URL}/funcionario/pessoa/${pessoaData.cpfpessoa}`);

        console.log('É funcionário?', isFuncionarioChecked, '| Existe no BD?', funcionarioExists);

        if (isFuncionarioChecked) {
            // Usuário QUER que seja funcionário
            const funcionarioData = {
                pessoacpfpessoa: pessoaData.cpfpessoa,
                cargosidcargo: parseInt(cargoSelect.value),
                salario: parseFloat(salarioInput.value),
                porcentagemcomissao: parseFloat(porcentagemComissaoInput.value)
            };

            console.log('Dados do funcionário:', funcionarioData);
            
            try {
                if (funcionarioExists) {
                    // Atualizar funcionário existente
                    const funcResponse = await fetch(`${API_BASE_URL}/funcionario/${pessoaData.cpfpessoa}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(funcionarioData)
                    });
                    
                    if (!funcResponse.ok) {
                        const error = await funcResponse.json();
                        console.error('Erro ao atualizar funcionário:', error);
                        mostrarMensagem('Aviso: Erro ao atualizar dados de funcionário', 'warning');
                    } else {
                        console.log('Funcionário atualizado com sucesso');
                    }
                } else {
                    // Criar novo funcionário
                    const funcResponse = await fetch(`${API_BASE_URL}/funcionario`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(funcionarioData)
                    });
                    
                    if (!funcResponse.ok) {
                        const error = await funcResponse.json();
                        console.error('Erro ao criar funcionário:', error);
                        mostrarMensagem('Aviso: Erro ao criar dados de funcionário', 'warning');
                    } else {
                        console.log('Funcionário criado com sucesso');
                    }
                }
            } catch (error) {
                console.error('Erro ao gerenciar funcionário:', error);
                mostrarMensagem('Aviso: Erro ao gerenciar funcionário', 'warning');
            }
        } else if (!isFuncionarioChecked && funcionarioExists) {
            // Usuário NÃO quer que seja funcionário, mas existe no BD - deletar
            try {
                console.log('Removendo dados de funcionário...');
                const deleteResponse = await fetch(`${API_BASE_URL}/funcionario/${pessoaData.cpfpessoa}`, {
                    method: 'DELETE'
                });
                if (deleteResponse.ok || deleteResponse.status === 204 || deleteResponse.status === 404) {
                    console.log('Dados de funcionário removidos');
                }
            } catch (error) {
                console.error('Erro ao excluir funcionário:', error);
            }
        }

        // Gerenciar cliente
        const isClienteChecked = checkboxCliente.checked;
        const clienteExists = await verificarExistencia(`${API_BASE_URL}/cliente/pessoa/${pessoaData.cpfpessoa}`);

        console.log('É cliente?', isClienteChecked, '| Existe no BD?', clienteExists);

        if (isClienteChecked) {
            // Usuário QUER que seja cliente
            const clienteData = {
                pessoacpfpessoa: pessoaData.cpfpessoa,
                rendacliente: parseFloat(rendaClienteInput.value),
                datadecadastrocliente: new Date().toISOString().split('T')[0]
            };

            console.log('Dados do cliente:', clienteData);
            
            try {
                if (clienteExists) {
                    // Atualizar cliente existente
                    const clienteResponse = await fetch(`${API_BASE_URL}/cliente/${pessoaData.cpfpessoa}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clienteData)
                    });
                    
                    if (!clienteResponse.ok) {
                        const error = await clienteResponse.json();
                        console.error('Erro ao atualizar cliente:', error);
                        mostrarMensagem('Aviso: Erro ao atualizar dados de cliente', 'warning');
                    } else {
                        console.log('Cliente atualizado com sucesso');
                    }
                } else {
                    // Criar novo cliente
                    const clienteResponse = await fetch(`${API_BASE_URL}/cliente`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(clienteData)
                    });
                    
                    if (!clienteResponse.ok) {
                        const error = await clienteResponse.json();
                        console.error('Erro ao criar cliente:', error);
                        mostrarMensagem('Aviso: Erro ao criar dados de cliente', 'warning');
                    } else {
                        console.log('Cliente criado com sucesso');
                    }
                }
            } catch (error) {
                console.error('Erro ao gerenciar cliente:', error);
                mostrarMensagem('Aviso: Erro ao gerenciar cliente', 'warning');
            }
        } else if (!isClienteChecked && clienteExists) {
            // Usuário NÃO quer que seja cliente, mas existe no BD - deletar
            try {
                console.log('Removendo dados de cliente...');
                const deleteResponse = await fetch(`${API_BASE_URL}/cliente/${pessoaData.cpfpessoa}`, {
                    method: 'DELETE'
                });
                if (deleteResponse.ok || deleteResponse.status === 204 || deleteResponse.status === 404) {
                    console.log('Dados de cliente removidos');
                }
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
            }
        }

        mostrarMensagem(`Operação de ${operacao} realizada com sucesso!`, 'success');
        limparFormulario();
        await carregarPessoas();
        mostrarBotoes(true, false, false, false, false, false);
        bloquearCampos(false);
        searchId.focus();

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem(`Erro ao ${operacao || 'processar'} pessoa: ${error.message}`, 'error');
    }
}

// Função para cancelar operação
function cancelarOperacao() {
    limparFormulario();
    mostrarBotoes(true, false, false, false, false, false);
    bloquearCampos(false);
    searchId.focus();
    mostrarMensagem('Operação cancelada', 'info');
}

// Função para carregar lista de pessoas
async function carregarPessoas() {
    try {
        const response = await fetch(`${API_BASE_URL}/pessoa/pessoas-completas`);
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
// Função para renderizar tabela de pessoas
function renderizarTabelaPessoas(pessoas) {
    pessoasTableBody.innerHTML = '';

    pessoas.forEach(pessoa => {
        const row = document.createElement('tr');
        
        const cargo = pessoa.eh_funcionario && pessoa.nomecargo ? pessoa.nomecargo : '-';
        const salario = pessoa.eh_funcionario && pessoa.salario 
            ? `R$ ${parseFloat(pessoa.salario).toFixed(2)}` 
            : '-';

        row.innerHTML = `
            <td>
                <button class="btn-id" onclick="selecionarPessoa('${pessoa.cpfpessoa}')">
                    ${pessoa.cpfpessoa}
                </button>
            </td>
            <td>${pessoa.nomepessoa}</td>
            <td>${pessoa.eh_funcionario ? '✅ Sim' : '❌ Não'}</td>
            <td>${pessoa.eh_cliente ? '✅ Sim' : '❌ Não'}</td>
            <td>${cargo}</td>
            <td>${salario}</td>
        `;
        pessoasTableBody.appendChild(row);
    });
}
// Função para selecionar pessoa da tabela
async function selecionarPessoa(cpfpessoa) {
    searchId.value = cpfpessoa;
    await buscarPessoa();
}

// Função auxiliar para verificar existência
async function verificarExistencia(url) {
    try {
        const response = await fetch(url);
        return response.ok;
    } catch (error) {
        console.error('Erro ao verificar existência:', error);
        return false;
    }
}