import { Router } from 'express';
import { CategoriaModel } from '../models/categoriaModel.js';
import { sanitizarTexto } from '../config/utils.js';

const router = Router();

// GET /api/categorias
router.get('/', async (req, res, next) => {
  try {
    const lista = await CategoriaModel.listarPorUsuario(req.usuarioId);
    return res.json(lista);
  } catch (err) {
    return next(err);
  }
});

// POST /api/categorias
router.post('/', async (req, res, next) => {
  try {
    const nome = sanitizarTexto(req.body.nome);
    const tipo = req.body.tipo;
    const classificacao = req.body.classificacao || 'necessidade';

    const campos = {};
    if (!nome) campos.nome = 'O nome da categoria é obrigatório.';
    if (!['entrada', 'saida'].includes(tipo)) campos.tipo = 'Tipo deve ser entrada ou saida.';
    if (!['necessidade', 'desejo', 'poupanca'].includes(classificacao)) {
      campos.classificacao = 'Classificação inválida.';
    }

    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    const criada = await CategoriaModel.criar({
      usuarioId: req.usuarioId,
      nome,
      tipo,
      classificacao
    });
    return res.status(201).json(criada);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Categoria duplicada.',
        campos: { nome: 'Você já possui uma categoria com este nome e tipo.' }
      });
    }
    return next(err);
  }
});

// PUT /api/categorias/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const nome = sanitizarTexto(req.body.nome);
    const tipo = req.body.tipo;
    const classificacao = req.body.classificacao || 'necessidade';

    if (!nome || !['entrada', 'saida'].includes(tipo)) {
      return res.status(400).json({ erro: 'Dados inválidos para atualização.' });
    }

    const atualizada = await CategoriaModel.atualizar(id, req.usuarioId, {
      nome,
      tipo,
      classificacao
    });
    if (!atualizada) return res.status(404).json({ erro: 'Categoria não encontrada.' });

    return res.json({ id, nome, tipo, classificacao });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Já existe outra categoria com este nome e tipo.'
      });
    }
    return next(err);
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await CategoriaModel.buscarPorId(id, req.usuarioId);
    if (!existente) return res.status(404).json({ erro: 'Categoria não encontrada.' });

    const emUso = await CategoriaModel.contarLancamentos(id, req.usuarioId);
    if (emUso > 0) {
      return res.status(409).json({
        erro: `Não é possível excluir: esta categoria possui ${emUso} lançamento(s) vinculado(s).`
      });
    }

    await CategoriaModel.excluir(id, req.usuarioId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;