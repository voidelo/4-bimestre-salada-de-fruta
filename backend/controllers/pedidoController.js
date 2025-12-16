const { query } = require('../database');
const path = require('path');

// ---------------------------------------------------------------------------
// ABRIR CRUD
// ---------------------------------------------------------------------------
exports.abrirCrudPedido = (req, res) => {
  console.log('pedidoController - Rota /abrirCrudPedido - abrir o crudPedido');
  res.sendFile(path.join(__dirname, '../../frontend/pedido/pedido.html'));
};

// ---------------------------------------------------------------------------
// LISTAR TODOS
// ---------------------------------------------------------------------------
exports.listarPedidos = async (req, res) => {
  try {
    const result = await query('SELECT * FROM pedido ORDER BY idpedido');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ---------------------------------------------------------------------------
// CRIAR PEDIDO
// ---------------------------------------------------------------------------
exports.criarPedido = async (req, res) => {
  try {
    const {
      idpedido,
      datadopedido,
      clientepessoacpfpessoa,
      funcionariopessoacpfpessoa
    } = req.body;

    // Validações básicas
    if (!idpedido || !datadopedido || !clientepessoacpfpessoa || !funcionariopessoacpfpessoa) {
      return res.status(400).json({
        error: 'Todos os campos (ID, data, cliente e funcionário) são obrigatórios'
      });
    }

    // Verifica se o ID já existe
    const existente = await query('SELECT * FROM pedido WHERE idpedido = $1', [idpedido]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Pedido com este ID já existe',
        tipo: 'ID_DUPLICADO'
      });
    }

    const result = await query(
      `INSERT INTO pedido (idpedido, datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [idpedido, datadopedido, clientepessoacpfpessoa, funcionariopessoacpfpessoa]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao criar pedido:', error);

    // Tratamento de chave duplicada
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Pedido com este ID já existe',
        tipo: 'ID_DUPLICADO'
      });
    }

    // Tratamento de chave estrangeira inválida
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'CPF do cliente ou funcionário não encontrado no sistema',
        tipo: 'FK_INVALIDA'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ---------------------------------------------------------------------------
// OBTER UM PEDIDO PELO ID
// ---------------------------------------------------------------------------
exports.obterPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    const result = await query(
      'SELECT * FROM pedido WHERE idpedido = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ---------------------------------------------------------------------------
// ATUALIZAR PEDIDO
// ---------------------------------------------------------------------------
exports.atualizarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      datadopedido,
      clientepessoacpfpessoa,
      funcionariopessoacpfpessoa
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // Verifica se o pedido existe
    const existing = await query(
      'SELECT * FROM pedido WHERE idpedido = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const atual = existing.rows[0];

    const updated = {
      datadopedido: datadopedido ?? atual.datadopedido,
      clientepessoacpfpessoa: clientepessoacpfpessoa ?? atual.clientepessoacpfpessoa,
      funcionariopessoacpfpessoa: funcionariopessoacpfpessoa ?? atual.funcionariopessoacpfpessoa
    };

    const updateResult = await query(
      `UPDATE pedido
         SET datadopedido = $1,
             clientepessoacpfpessoa = $2,
             funcionariopessoacpfpessoa = $3
       WHERE idpedido = $4
       RETURNING *`,
      [
        updated.datadopedido,
        updated.clientepessoacpfpessoa,
        updated.funcionariopessoacpfpessoa,
        id
      ]
    );

    res.json(updateResult.rows[0]);

  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    
    // Tratamento de chave estrangeira inválida
    if (error.code === '23503') {
      return res.status(400).json({ 
        error: 'CPF do cliente ou funcionário não encontrado no sistema',
        tipo: 'FK_INVALIDA'
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ---------------------------------------------------------------------------
// DELETAR PEDIDO
// ---------------------------------------------------------------------------
exports.deletarPedido = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID deve ser um número válido' });
    }

    // Verifica se o pedido existe
    const existing = await query(
      'SELECT * FROM pedido WHERE idpedido = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verifica se o pedido tem produtos associados
    const produtosRelacionados = await query(
      'SELECT COUNT(*) as total FROM pedidohasproduto WHERE pedidoidpedido = $1',
      [id]
    );

    if (parseInt(produtosRelacionados.rows[0].total) > 0) {
      return res.status(409).json({ 
        error: 'Não é possível excluir este pedido pois ele possui produtos associados.',
        tipo: 'PEDIDO_COM_PRODUTOS'
      });
    }

    await query(
      'DELETE FROM pedido WHERE idpedido = $1',
      [id]
    );

    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar pedido:', error);

    // Tratamento de chave estrangeira
    if (error.code === '23503') {
      return res.status(409).json({
        error: 'Não é possível excluir este pedido pois ele possui dependências associadas.',
        tipo: 'VIOLACAO_INTEGRIDADE'
      });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};