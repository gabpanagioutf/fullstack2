import { Router } from 'express';
import { RelatorioModel } from '../models/relatorioModel.js';
import { dataValida } from '../config/utils.js';

const router = Router();

function obterPeriodoPadrao(query) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate();

  const inicio = query.inicio || `${ano}-${mes}-01`;
  const fim = query.fim || `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
  return { inicio, fim };
}

// GET /api/relatorios/categorias
router.get('/categorias', async (req, res, next) => {
  try {
    const { inicio, fim } = obterPeriodoPadrao(req.query);
    if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) {
      return res.status(400).json({ erro: 'Período inválido.' });
    }
    const dados = await RelatorioModel.porCategoria(req.usuarioId, inicio, fim);
    return res.json(dados);
  } catch (err) {
    return next(err);
  }
});

// GET /api/relatorios/fontes-destinos
router.get('/fontes-destinos', async (req, res, next) => {
  try {
    const { inicio, fim } = obterPeriodoPadrao(req.query);
    if (!dataValida(inicio) || !dataValida(fim) || inicio > fim) {
      return res.status(400).json({ erro: 'Período inválido.' });
    }
    const dados = await RelatorioModel.porFonteDestino(req.usuarioId, inicio, fim);
    return res.json(dados);
  } catch (err) {
    return next(err);
  }
});

// GET /api/relatorios/faturas
router.get('/faturas', async (req, res, next) => {
  try {
    const meses = Math.min(12, Math.max(4, Number(req.query.meses) || 4));
    const dados = await RelatorioModel.faturasCartoes(req.usuarioId, meses);
    return res.json(dados);
  } catch (err) {
    return next(err);
  }
});

// GET /api/relatorios/saude-financeira (e alias /api/saude-financeira)
router.get('/saude-financeira', async (req, res, next) => {
  try {
    const dados = await RelatorioModel.saudeFinanceira(req.usuarioId);
    return res.json(dados);
  } catch (err) {
    return next(err);
  }
});

export default router;