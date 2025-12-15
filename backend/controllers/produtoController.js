const { query } = require('../database');
const path = require('path');

// Caminho absoluto para a pasta frontend
const caminhoFrontend = path.join(__dirname, '../frontend');

// --- ABRIR CRUD PRODUTO ---
exports.abrirCrudProduto = (req, res) => {
  console.log('produtoController - Rota /abrirCrudProduto - abrir o crudProduto');
  
  res.sendFile(path.join(__dirname, '../../frontend/produto/produto.html'));
};

// --- LISTAR PRODUTOS ---
exports.listarProdutos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM produto ORDER BY idproduto');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- CRIAR PRODUTO ---
exports.criarProduto = async (req, res) => {
  try {
    const { idproduto, nomeproduto, quantidadeemestoque, precounitario } = req.body;

    if (!nomeproduto || quantidadeemestoque == null || precounitario == null) {
      return res.status(400).json({ error: 'Campos obrigatórios não fornecidos' });
    }

    const result = await query(
      'INSERT INTO produto (idproduto, nomeproduto, quantidadeemestoque, precounitario) VALUES ($1, $2, $3, $4) RETURNING *',
      [idproduto, nomeproduto, quantidadeemestoque, precounitario]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- OBTER PRODUTO POR ID ---
exports.obterProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query('SELECT * FROM produto WHERE idproduto = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- ATUALIZAR PRODUTO ---
exports.atualizarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nomeproduto, quantidadeemestoque, precounitario } = req.body;

    const existing = await query('SELECT * FROM produto WHERE idproduto = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    const current = existing.rows[0];
    const updatedFields = {
      nomeproduto: nomeproduto ?? current.nomeproduto,
      quantidadeemestoque: quantidadeemestoque ?? current.quantidadeemestoque,
      precounitario: precounitario ?? current.precounitario
    };

    const result = await query(
      'UPDATE produto SET nomeproduto = $1, quantidadeemestoque = $2, precounitario = $3 WHERE idproduto = $4 RETURNING *',
      [updatedFields.nomeproduto, updatedFields.quantidadeemestoque, updatedFields.precounitario, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// --- DELETAR PRODUTO ---
exports.deletarProduto = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await query('SELECT * FROM produto WHERE idproduto = $1', [id]);

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await query('DELETE FROM produto WHERE idproduto = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
