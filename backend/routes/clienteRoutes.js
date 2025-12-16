const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// CRUD de Clientes
router.get('/pessoa/:cpf', clienteController.obterClientePorCpf);
router.get('/:cpf', clienteController.obterCliente);
router.post('/', clienteController.criarCliente);
router.put('/:cpf', clienteController.atualizarCliente);
router.delete('/:cpf', clienteController.deletarCliente);
router.get('/', clienteController.listarClientes);

module.exports = router;