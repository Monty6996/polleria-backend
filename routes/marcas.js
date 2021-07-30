const express = require('express');

const router = express.Router();
const { get, create, update } = require('../models/marcas');
const {
	validateCreate,
	validateModify,
} = require('../middleware/categorias_marcas');
const { verificarToken, isAdmin } = require('../middleware/validaciones');

// *GetAll
router.get('/', async (req, res) => {
	try {
		const [marcas] = await get({ eliminado: 0 });
		res.status(200).json(marcas).end();
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

// *GetSingle
router.get('/:id', async (req, res) => {
	try {
		const [marca] = await get({ id: req.params.id, eliminado: 0 });
		marca
			? res.status(200).json(marca)
			: res.status(404).json({ error: 'Not Found' });
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

router.post('/', verificarToken, isAdmin, validateCreate, async (req, res) => {
	try {
		const mensaje = await create(req.body);
		res.status(201).json(mensaje);
	} catch (error) {
		res.sendStatus(500);
	}
});

router.put('/', verificarToken, isAdmin, validateModify, async (req, res) => {
	try {
		const mensaje = await update({ id: req.body.id }, req.body);
		res.status(201).json(mensaje);
	} catch (error) {
		res.sendStatus(500);
	}
});

router.delete('/', verificarToken, isAdmin, async (req, res) => {
	try {
		const mensaje = await update({ id: req.body.id }, { eliminado: 1 });
		res.status(200).json(mensaje);
	} catch (error) {
		res.sendStatus(500);
	}
});

module.exports = router;
