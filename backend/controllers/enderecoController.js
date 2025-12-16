const { query } = require('../database');
const path = require('path');

// --- ABRIR CRUD ENDERECO ---
exports.abrirCrudEndereco = (req, res) => {
  console.log('enderecoController - Rota /abrirCrudEndereco - abrir o crudEndereco');
  res.sendFile(path.join(__dirname, '../../frontend/endereco/endereco.html'));
};

// --- LISTAR ENDERECOS ---
exports.listarEnderecos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM endereco ORDER BY idendereco');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar enderecos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- CRIAR ENDERECO ---
exports.criarEndereco = async (req, res) => {
  try {
    const { idendereco, logradouro, numero, referencia, cep, cidadeidcidade } = req.body;

    if (!idendereco || !logradouro || !cep || !cidadeidcidade) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: ID, logradouro, CEP e cidade' 
      });
    }

    // Verifica se o ID já existe
    const existente = await query('SELECT * FROM endereco WHERE idendereco = $1', [idendereco]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Endereço com este ID já existe',
        tipo: 'ID_DUPLICADO'
      });
    }

    const result = await query(
      'INSERT INTO endereco (idendereco, logradouro, numero, referencia, cep, cidadeidcidade) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [idendereco, logradouro, numero, referencia, cep, cidadeidcidade]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar endereco:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Endereço com este ID já existe',
        tipo: 'ID_DUPLICADO'
      });
    }
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'ID da cidade não encontrado no sistema',
        tipo: 'FK_INVALIDA'
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- OBTER ENDERECO POR ID ---
exports.obterEndereco = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query('SELECT * FROM endereco WHERE idendereco = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter endereco:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- ATUALIZAR ENDERECO ---
exports.atualizarEndereco = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { logradouro, numero, referencia, cep, cidadeidcidade } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const existing = await query('SELECT * FROM endereco WHERE idendereco = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    const current = existing.rows[0];
    const updatedFields = {
      logradouro: logradouro ?? current.logradouro,
      numero: numero ?? current.numero,
      referencia: referencia ?? current.referencia,
      cep: cep ?? current.cep,
      cidadeidcidade: cidadeidcidade ?? current.cidadeidcidade
    };

    const result = await query(
      'UPDATE endereco SET logradouro = $1, numero = $2, referencia = $3, cep = $4, cidadeidcidade = $5 WHERE idendereco = $6 RETURNING *',
      [updatedFields.logradouro, updatedFields.numero, updatedFields.referencia, updatedFields.cep, updatedFields.cidadeidcidade, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar endereco:', error);
    
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'ID da cidade não encontrado no sistema',
        tipo: 'FK_INVALIDA'
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- DELETAR ENDERECO ---
exports.deletarEndereco = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }
    
    const existing = await query('SELECT * FROM endereco WHERE idendereco = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }

    // Verifica se o endereço está sendo usado (por exemplo, em pessoa)
    const pessoasRelacionadas = await query(
      'SELECT COUNT(*) as total FROM pessoa WHERE enderecoenderecoid = $1',
      [id]
    );

    if (parseInt(pessoasRelacionadas.rows[0].total) > 0) {
      return res.status(409).json({ 
        error: 'Não é possível excluir este endereço pois ele está vinculado a uma ou mais pessoas.',
        tipo: 'ENDERECO_EM_USO'
      });
    }

    await query('DELETE FROM endereco WHERE idendereco = $1', [id]);
    res.status(204).send();
    
  } catch (error) {
    console.error('Erro ao deletar endereco:', error);
    
    if (error.code === '23503') {
      return res.status(409).json({ 
        error: 'Não é possível excluir este endereço pois ele está vinculado a outros registros.',
        tipo: 'VIOLACAO_INTEGRIDADE'
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};