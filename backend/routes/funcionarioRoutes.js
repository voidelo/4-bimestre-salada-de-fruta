const express = require('express');
const router = express.Router();
const funcionarioController = require('../controllers/funcionarioController');

// CRUD de Funcionários
router.get('/pessoa/:cpf', funcionarioController.obterFuncionarioPorCpf);
router.get('/:cpf', funcionarioController.obterFuncionario);
router.post('/', funcionarioController.criarFuncionario);
router.put('/:cpf', funcionarioController.atualizarFuncionario);
router.delete('/:cpf', funcionarioController.deletarFuncionario);
router.get('/', funcionarioController.listarFuncionarios);

module.exports = router;