const { v4: uuid } = require('uuid');
const sha1 = require('sha1');
const jwt = require('jsonwebtoken');
const model = require('../models/usuarios');
const { send } = require('../services/mail');

const singOptions = { algorithm: 'RS256' };
const createToken = (payload) =>
	jwt.sign(payload, process.env.PRIVATE_KEY, singOptions);

const registro = async (req, res) => {
	try {
		const { nombre, apellido, email, password } = req.body;
		const [exists] = await model.get({ email });
		if (exists) {
			if (exists.eliminado === 0) {
				return res.status(400).json({ error: 'el usuario ya existe!' });
			}
			await model.update(
				{ id: exists.id },
				{ eliminado: 0, habilitado: 0, ...req.body }
			);
			const mailinfo = {
				to: email,
				subject: 'Gracias por registrarte :D',
				html: `<a href = "${process.env.URL}/auth/confirmacion/${exists.confirmacionCorreo}">Click Aqui para confirmar su correo</a>`,
			};
			const mensaje = await send(mailinfo);
			return res.status(200).json(mensaje);
		}
		const usuario = {
			id: uuid(),
			nombre,
			apellido,
			email,
			password: sha1(password),
			confirmacionCorreo: uuid(),
		};
		await model.create(usuario);
		const mailinfo = {
			to: email,
			subject: 'Gracias por registrarte :D',
			html: `<a href = "${process.env.URL}/auth/confirmacion/${usuario.confirmacionCorreo}">Click Aqui para confirmar su correo</a>`,
		};
		const mensaje = await send(mailinfo);
		res.status(200).json(mensaje);
	} catch (error) {
		res.status(500).json({ error });
	}
};

const login = async (req, res) => {
	const { email, password } = req.body;
	try {
		const [usuario] = await model.get({ email }, [
			'id',
			'password',
			'eliminado',
			'habilitado',
		]);

		if (!usuario || usuario.eliminado === 1 || usuario.habilitado === 0) {
			res.status(404).json({ error: 'El usuario no existe' });
		} else if (usuario.password === sha1(password)) {
			const token = createToken({ id: usuario.id });
			res.status(200).json({ JWT: token });
		} else {
			res.status(400).json({ error: 'email o constraseña incorrecta!' });
		}
	} catch (error) {
		res.status(500).json({ error });
	}
};

const confirmCorreo = async (req, res) => {
	try {
		const { uid } = req.params;
		await model.update({ confirmacionCorreo: uid }, { habilitado: 1 });
		res.redirect(301, 'https://manuelmontanana.com.ar/success');
	} catch (e) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
};

module.exports = { registro, login, confirmCorreo };
