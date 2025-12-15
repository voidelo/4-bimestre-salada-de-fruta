const { query } = require('../database');
const path = require('path');

exports.abrirCrudPessoa = (req, res) => {
  console.log('pessoaController - Rota /abrirCrudPessoa - abrir o crudPessoa');
  res.sendFile(path.join(__dirname, '../../frontend/pessoa/pessoa.html'));
};

exports.listarPessoas = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pessoa ORDER BY cpfpessoa');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.criarPessoa = async (req, res) => {
  try {
    const { nomePessoa } = req.body;

    if (!nomePessoa) {
      return res.status(400).json({ error: 'O campo nomePessoa é obrigatório' });
    }

    // ✅ Corrigido: removido cpfpessoa porque o banco gera automaticamente
    const result = await query(
      'INSERT INTO pessoa (nomePessoa) VALUES ($1) RETURNING *',
      [nomePessoa]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.obterPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;

    const result = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpf]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.atualizarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;
    const { nomePessoa } = req.body;

    const existingPerson = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpf]);

    if (existingPerson.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    const updated = await query(
      'UPDATE pessoa SET nomePessoa = $1 WHERE cpfpessoa = $2 RETURNING *',
      [nomePessoa || existingPerson.rows[0].nomePessoa, cpf]
    );

    res.json(updated.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.deletarPessoa = async (req, res) => {
  try {
    const cpf = req.params.id;

    const existingPerson = await query('SELECT * FROM pessoa WHERE cpfpessoa = $1', [cpf]);

    if (existingPerson.rows.length === 0) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    await query('DELETE FROM pessoa WHERE cpfpessoa = $1', [cpf]);

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar pessoa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

