const { query } = require('../database');
const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};

exports.listarPessoas = async (req, res) => {
  try {
    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.listarPessoas();
    } else {
      result = await query("SELECT * FROM pessoa ORDER BY cpfpessoa");
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.listarPessoasCompletas = async (req, res) => {
  try {
    const queryText = `
      SELECT 
        p.cpfpessoa,
        p.nomepessoa,
        p.datanascimentopessoa,
        p.enderecoidendereco,
        f.salario,
        f.porcentagemcomissao,
        c.nomecargo,
        CASE WHEN f.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as eh_funcionario,
        CASE WHEN cl.pessoacpfpessoa IS NOT NULL THEN true ELSE false END as eh_cliente,
        cl.rendacliente
      FROM pessoa p
      LEFT JOIN funcionario f ON p.cpfpessoa = f.pessoacpfpessoa
      LEFT JOIN cliente cl ON p.cpfpessoa = cl.pessoacpfpessoa
      LEFT JOIN cargo c ON f.cargosidcargo = c.idcargo
      ORDER BY p.cpfpessoa
    `;
    
    const result = await query(queryText);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas completas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarPessoa = async (req, res) => {
  try {
    const { cpfpessoa, nomepessoa, datanascimentopessoa, enderecoidendereco } = req.body;

    console.log('Criando pessoa:', req.body);

    // Validação básica
    if (!nomepessoa || !cpfpessoa) {
      return res.status(400).json({
        error: 'Nome e CPF são obrigatórios'
      });
    }

    // Validação de CPF (11 dígitos)
    if (cpfpessoa.length !== 11) {
      return res.status(400).json({
        error: 'CPF deve conter 11 dígitos'
      });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.criarPessoa({
        cpfpessoa, 
        nomepessoa, 
        datanascimentopessoa, 
        enderecoidendereco
      });
    } else {
      const queryText = 'INSERT INTO pessoa (cpfpessoa, nomepessoa, datanascimentopessoa, enderecoidendereco) VALUES ($1, $2, $3, $4) RETURNING *';
      const queryParams = [cpfpessoa, nomepessoa, datanascimentopessoa || null, enderecoidendereco || null];

      result = await query(queryText, queryParams);
    }

    console.log('Pessoa criada:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);

    // Verifica se é erro de CPF duplicado
    if (error.code === '23505' && error.constraint === 'pessoa_pkey') {
      return res.status(400).json({
        error: 'CPF já está em uso'
      });
    }

    // Verifica se é erro de violação de constraint NOT NULL
    if (error.code === '23502') {
      return res.status(400).json({
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    // Verifica se é erro de foreign key (endereço inválido)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Endereço inválido ou não encontrado'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.id;

    console.log('Buscando pessoa com CPF:', cpfpessoa);

    if (!cpfpessoa) {
      return res.status(400).json({ error: 'CPF é obrigatório' });
    }

    let result;
    if (global.useMockData) {
      result = await global.mockDatabase.obterPessoa(cpfpessoa);
    } else {
      result = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    console.log('Pessoa encontrada:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.id;
    const { nomepessoa, datanascimentopessoa, enderecoidendereco } = req.body;

    console.log('Atualizando pessoa CPF:', cpfpessoa);
    console.log('Dados recebidos:', req.body);

    // Verifica se a pessoa existe
    const existingPersonResult = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Constrói os campos para atualização
    const currentPerson = existingPersonResult.rows[0];
    const updatedFields = {
      nomepessoa: nomepessoa !== undefined ? nomepessoa : currentPerson.nomepessoa,
      datanascimentopessoa: datanascimentopessoa !== undefined ? datanascimentopessoa : currentPerson.datanascimentopessoa,
      enderecoidendereco: enderecoidendereco !== undefined ? enderecoidendereco : currentPerson.enderecoidendereco
    };

    console.log('Valores para atualização:', updatedFields);

    // Atualiza a pessoa
    const updateResult = await query(
      'UPDATE pessoa SET nomepessoa = $1, datanascimentopessoa = $2, enderecoidendereco = $3 WHERE cpfpessoa = $4 RETURNING *',
      [updatedFields.nomepessoa, updatedFields.datanascimentopessoa, updatedFields.enderecoidendereco, cpfpessoa]
    );

    console.log('Pessoa atualizada:', updateResult.rows[0]);
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);

    // Verifica se é erro de foreign key (endereço inválido)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Endereço inválido ou não encontrado'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPessoa = async (req, res) => {
  try {
    const cpfpessoa = req.params.id;

    console.log('Deletando pessoa com CPF:', cpfpessoa);

    // Verifica se a pessoa existe
    const existingPersonResult = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);

    if (existingPersonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    // Deleta a pessoa (as constraints CASCADE cuidarão das dependências)
    await query('DELETE FROM pessoa WHERE cpfpessoa = $1', [cpfpessoa]);

    console.log('Pessoa deletada com sucesso');
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);

    // Verifica se é erro de violação de foreign key (dependências)
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar pessoa com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};