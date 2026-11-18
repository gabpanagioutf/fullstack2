import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { UsuarioModel } from '../models/usuarioModel.js';
import { cpfValido, sanitizarTexto } from '../config/utils.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

// POST /api/auth/cadastro
router.post('/cadastro', async (req, res, next) => {
  try {
    const nome = sanitizarTexto(req.body.nome);
    const email = String(req.body.email || '').trim().toLowerCase();
    const cpf = String(req.body.cpf || '').replace(/\D/g, '');
    const senha = String(req.body.senha || '');
    const confirmacaoSenha = String(req.body.confirmacaoSenha || '');

    const campos = {};
    if (!nome || nome.length < 3) campos.nome = 'Nome deve ter pelo menos 3 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) campos.email = 'E-mail inválido.';
    if (!cpfValido(cpf)) campos.cpf = 'CPF inválido (verifique os dígitos).';
    if (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/\d/.test(senha)) {
      campos.senha = 'A senha deve ter no mínimo 8 caracteres, com letras e números.';
    }
    if (senha !== confirmacaoSenha) {
      campos.confirmacaoSenha = 'As senhas não coincidem.';
    }

    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await UsuarioModel.criarComPadroes({ nome, email, cpf, senhaHash });

    return res.status(201).json(usuario);
  } catch (err) {
    // Violação de UNIQUE no MySQL (1062)
    if (err.code === 'ER_DUP_ENTRY') {
      const msg = String(err.sqlMessage || '');
      const campo = msg.includes('cpf') ? 'cpf' : 'email';
      return res.status(409).json({
        erro: 'Usuário já cadastrado.',
        campos: {
          [campo]: `Já existe um usuário cadastrado com este ${campo === 'cpf' ? 'CPF' : 'e-mail'}.`
        }
      });
    }
    return next(err);
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const usuario = await UsuarioModel.buscarPorEmail(email);
    const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;

    if (!usuario || !senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { sub: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res, next) => {
  try {
    const usuario = await UsuarioModel.buscarPorId(req.usuarioId);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    return res.json(usuario);
  } catch (err) {
    return next(err);
  }
});

export default router;