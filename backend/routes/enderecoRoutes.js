const express = require('express');
const router = express.Router();
const enderecoController = require('../controllers/enderecoController');

// Rota para abrir a página do CRUD
router.get('/abrirCrudEndereco', enderecoController.abrirCrudEndereco);

// Rotas CRUD
router.get('/', enderecoController.listarEnderecos);
router.post('/', enderecoController.criarEndereco);
router.get('/:id', enderecoController.obterEndereco);
router.put('/:id', enderecoController.atualizarEndereco);
router.delete('/:id', enderecoController.deletarEndereco);

module.exports = router;