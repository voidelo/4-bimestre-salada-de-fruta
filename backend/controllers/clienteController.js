const { query } = require('../database');

exports.listarClientes = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        c.pessoacpfpessoa,
        c.rendacliente,
        c.datadecadastrocliente,
        p.nomepessoa
      FROM cliente c
      INNER JOIN pessoa p ON c.pessoacpfpessoa = p.cpfpessoa
      ORDER BY p.nomepessoa
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    const result = await query(`
      SELECT 
        c.pessoacpfpessoa,
        c.rendacliente,
        c.datadecadastrocliente,
        p.nomepessoa
      FROM cliente c
      INNER JOIN pessoa p ON c.pessoacpfpessoa = p.cpfpessoa
      WHERE c.pessoacpfpessoa = $1
    `, [cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterClientePorCpf = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    console.log('Buscando cliente com CPF:', cpf);

    if (!cpf || cpf.length !== 11) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const result = await query(`
      SELECT 
        c.pessoacpfpessoa,
        c.rendacliente,
        c.datadecadastrocliente,
        p.nomepessoa
      FROM cliente c
      INNER JOIN pessoa p ON c.pessoacpfpessoa = p.cpfpessoa
      WHERE c.pessoacpfpessoa = $1
    `, [cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    console.log('Cliente encontrado:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(404).json({ error: 'Cliente não encontrado' });
  }
};

exports.criarCliente = async (req, res) => {
  try {
    const { pessoacpfpessoa, rendacliente, datadecadastrocliente } = req.body;

    // Validação básica
    if (!pessoacpfpessoa || !rendacliente) {
      return res.status(400).json({
        error: 'CPF e renda são obrigatórios'
      });
    }

    if (pessoacpfpessoa.length !== 11) {
      return res.status(400).json({
        error: 'CPF deve conter 11 dígitos'
      });
    }

    // Verifica se a pessoa existe
    const pessoaExists = await query(
      'SELECT cpfpessoa FROM pessoa WHERE cpfpessoa = $1',
      [pessoacpfpessoa]
    );

    if (pessoaExists.rows.length === 0) {
      return res.status(400).json({
        error: 'Pessoa não encontrada'
      });
    }

    const dataFinal = datadecadastrocliente || new Date().toISOString().split('T')[0];

    const result = await query(
      'INSERT INTO cliente (pessoacpfpessoa, rendacliente, datadecadastrocliente) VALUES ($1, $2, $3) RETURNING *',
      [pessoacpfpessoa, rendacliente, dataFinal]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Cliente já cadastrado para esta pessoa'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Pessoa não encontrada'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const { rendacliente, datadecadastrocliente } = req.body;

    // Verifica se o cliente existe
    const existingCliente = await query(
      'SELECT * FROM cliente WHERE pessoacpfpessoa = $1',
      [cpf]
    );

    if (existingCliente.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    const currentCliente = existingCliente.rows[0];
    const updatedFields = {
      rendacliente: rendacliente !== undefined ? rendacliente : currentCliente.rendacliente,
      datadecadastrocliente: datadecadastrocliente !== undefined ? datadecadastrocliente : currentCliente.datadecadastrocliente
    };

    const result = await query(
      'UPDATE cliente SET rendacliente = $1, datadecadastrocliente = $2 WHERE pessoacpfpessoa = $3 RETURNING *',
      [updatedFields.rendacliente, updatedFields.datadecadastrocliente, cpf]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarCliente = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    const existingCliente = await query(
      'SELECT * FROM cliente WHERE pessoacpfpessoa = $1',
      [cpf]
    );

    if (existingCliente.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    await query('DELETE FROM cliente WHERE pessoacpfpessoa = $1', [cpf]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar cliente com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};