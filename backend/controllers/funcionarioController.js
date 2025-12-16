const { query } = require('../database');

exports.listarFuncionarios = async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        f.pessoacpfpessoa,
        f.salario,
        f.porcentagemcomissao,
        f.cargosidcargo,
        p.nomepessoa,
        c.nomecargo
      FROM funcionario f
      INNER JOIN pessoa p ON f.pessoacpfpessoa = p.cpfpessoa
      LEFT JOIN cargos c ON f.cargosidcargo = c.idcargo
      ORDER BY p.nomepessoa
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterFuncionario = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    if (!cpf || cpf.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido' });
    }

    const result = await query(`
      SELECT 
        f.pessoacpfpessoa,
        f.salario,
        f.porcentagemcomissao,
        f.cargosidcargo,
        p.nomepessoa,
        c.nomecargo
      FROM funcionario f
      INNER JOIN pessoa p ON f.pessoacpfpessoa = p.cpfpessoa
      LEFT JOIN cargos c ON f.cargosidcargo = c.idcargo
      WHERE f.pessoacpfpessoa = $1
    `, [cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterFuncionarioPorCpf = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    console.log('Buscando funcionário com CPF:', cpf);

    if (!cpf || cpf.length !== 11) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const result = await query(`
      SELECT 
        f.pessoacpfpessoa,
        f.salario,
        f.porcentagemcomissao,
        f.cargosidcargo,
        p.nomepessoa,
        c.nomecargo
      FROM funcionario f
      INNER JOIN pessoa p ON f.pessoacpfpessoa = p.cpfpessoa
      LEFT JOIN cargo c ON f.cargosidcargo = c.idcargo
      WHERE f.pessoacpfpessoa = $1
    `, [cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    console.log('Funcionário encontrado:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter funcionário:', error);
    res.status(404).json({ error: 'Funcionário não encontrado' });
  }
};

exports.criarFuncionario = async (req, res) => {
  try {
    const { pessoacpfpessoa, salario, porcentagemcomissao, cargosidcargo } = req.body;

    // Validação básica
    if (!pessoacpfpessoa || !salario || !porcentagemcomissao || !cargosidcargo) {
      return res.status(400).json({
        error: 'Todos os campos são obrigatórios'
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

    const result = await query(
      'INSERT INTO funcionario (pessoacpfpessoa, salario, porcentagemcomissao, cargosidcargo) VALUES ($1, $2, $3, $4) RETURNING *',
      [pessoacpfpessoa, salario, porcentagemcomissao, cargosidcargo]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        error: 'Funcionário já cadastrado para esta pessoa'
      });
    }

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Cargo inválido ou pessoa não encontrada'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarFuncionario = async (req, res) => {
  try {
    const cpf = req.params.cpf;
    const { salario, porcentagemcomissao, cargosidcargo } = req.body;

    // Verifica se o funcionário existe
    const existingFunc = await query(
      'SELECT * FROM funcionario WHERE pessoacpfpessoa = $1',
      [cpf]
    );

    if (existingFunc.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    const currentFunc = existingFunc.rows[0];
    const updatedFields = {
      salario: salario !== undefined ? salario : currentFunc.salario,
      porcentagemcomissao: porcentagemcomissao !== undefined ? porcentagemcomissao : currentFunc.porcentagemcomissao,
      cargosidcargo: cargosidcargo !== undefined ? cargosidcargo : currentFunc.cargosidcargo
    };

    const result = await query(
      'UPDATE funcionario SET salario = $1, porcentagemcomissao = $2, cargosidcargo = $3 WHERE pessoacpfpessoa = $4 RETURNING *',
      [updatedFields.salario, updatedFields.porcentagemcomissao, updatedFields.cargosidcargo, cpf]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Cargo inválido'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarFuncionario = async (req, res) => {
  try {
    const cpf = req.params.cpf;

    const existingFunc = await query(
      'SELECT * FROM funcionario WHERE pessoacpfpessoa = $1',
      [cpf]
    );

    if (existingFunc.rows.length === 0) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    await query('DELETE FROM funcionario WHERE pessoacpfpessoa = $1', [cpf]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar funcionário:', error);

    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Não é possível deletar funcionário com dependências associadas'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};