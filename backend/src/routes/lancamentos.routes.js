import { Router } from 'express';
import { LancamentoModel } from '../models/lancamentoModel.js';
import { CategoriaModel } from '../models/categoriaModel.js';
import { FonteDestinoModel } from '../models/fonteDestinoModel.js';
import { dataValida, sanitizarTexto } from '../config/utils.js';

const router = Router();

// GET /api/lancamentos
router.get('/', async (req, res, next) => {
  try {
    const { inicio, fim, tipo, categoriaId, fonteDestinoId, pagina, limite } = req.query;
    const resultado = await LancamentoModel.listar(req.usuarioId, {
      inicio,
      fim,
      tipo,
      categoriaId,
      fonteDestinoId,
      pagina,
      limite
    });
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
});

// GET /api/lancamentos/:id
router.get('/:id', async (req, res, next) => {
  try {
    const item = await LancamentoModel.buscarPorId(Number(req.params.id), req.usuarioId);
    if (!item) return res.status(404).json({ erro: 'Lançamento não encontrado.' });
    return res.json(item);
  } catch (err) {
    return next(err);
  }
});

// POST /api/lancamentos
router.post('/', async (req, res, next) => {
  try {
    const tipo = req.body.tipo;
    const descricao = sanitizarTexto(req.body.descricao);
    const valor = Number(req.body.valor);
    const data = String(req.body.data || '');
    const categoriaId = Number(req.body.categoria_id);
    const fonteDestinoId = Number(req.body.fonte_destino_id);
    const totalParcelas = Number(req.body.total_parcelas || 1);

    const campos = {};
    if (!['entrada', 'saida'].includes(tipo)) campos.tipo = 'Tipo deve ser entrada ou saida.';
    if (!descricao) campos.descricao = 'Descrição é obrigatória.';
    if (!valor || valor <= 0) campos.valor = 'O valor deve ser maior que zero.';
    if (!dataValida(data)) campos.data = 'Data inválida (use AAAA-MM-DD).';
    if (!categoriaId) campos.categoria_id = 'Categoria é obrigatória.';
    if (!fonteDestinoId) campos.fonte_destino_id = 'Fonte/Destino é obrigatório.';
    if (!Number.isInteger(totalParcelas) || totalParcelas < 1 || totalParcelas > 48) {
      campos.total_parcelas = 'Parcelas devem estar entre 1 e 48.';
    }

    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    // Verifica posse da categoria e compatibilidade de tipo (RF3 e RF6)
    const categoria = await CategoriaModel.buscarPorId(categoriaId, req.usuarioId);
    if (!categoria) {
      return res.status(404).json({
        erro: 'Categoria não encontrada.',
        campos: { categoria_id: 'Categoria inválida.' }
      });
    }
    if (categoria.tipo !== tipo) {
      return res.status(400).json({
        erro: 'Dados inválidos.',
        campos: {
          categoria_id: `A categoria "${categoria.nome}" é de ${categoria.tipo}, mas o lançamento é de ${tipo}.`
        }
      });
    }

    // Verifica posse da fonte/destino
    const fonteDestino = await FonteDestinoModel.buscarPorId(fonteDestinoId, req.usuarioId);
    if (!fonteDestino) {
      return res.status(404).json({
        erro: 'Fonte/Destino não encontrado.',
        campos: { fonte_destino_id: 'Fonte/Destino inválido.' }
      });
    }

    // Só permite parcelamento em cartão de crédito de saída
    if (totalParcelas > 1 && (fonteDestino.tipo !== 'cartao_credito' || tipo !== 'saida')) {
      return res.status(400).json({
        erro: 'Dados inválidos.',
        campos: {
          total_parcelas: 'Parcelamento só é permitido para saídas no cartão de crédito.'
        }
      });
    }

    const criado = await LancamentoModel.criar({
      usuarioId: req.usuarioId,
      tipo,
      descricao,
      valor,
      data,
      categoriaId,
      fonteDestinoId,
      totalParcelas
    });

    return res.status(201).json(criado);
  } catch (err) {
    return next(err);
  }
});

// PUT /api/lancamentos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await LancamentoModel.buscarPorId(id, req.usuarioId);
    if (!existente) return res.status(404).json({ erro: 'Lançamento não encontrado.' });

    const tipo = req.body.tipo;
    const descricao = sanitizarTexto(req.body.descricao);
    const valor = Number(req.body.valor);
    const data = String(req.body.data || '');
    const categoriaId = Number(req.body.categoria_id);
    const fonteDestinoId = Number(req.body.fonte_destino_id);

    const campos = {};
    if (!['entrada', 'saida'].includes(tipo)) campos.tipo = 'Tipo inválido.';
    if (!descricao) campos.descricao = 'Descrição obrigatória.';
    if (!valor || valor <= 0) campos.valor = 'Valor deve ser positivo.';
    if (!dataValida(data)) campos.data = 'Data inválida.';

    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    const categoria = await CategoriaModel.buscarPorId(categoriaId, req.usuarioId);
    if (!categoria) return res.status(404).json({ erro: 'Categoria não encontrada.' });
    if (categoria.tipo !== tipo) {
      return res.status(400).json({
        erro: 'Dados inválidos.',
        campos: { categoria_id: 'Tipo da categoria incompatível com o lançamento.' }
      });
    }

    const fonteDestino = await FonteDestinoModel.buscarPorId(fonteDestinoId, req.usuarioId);
    if (!fonteDestino) return res.status(404).json({ erro: 'Fonte/Destino não encontrado.' });

    const atualizado = await LancamentoModel.atualizar(id, req.usuarioId, {
      tipo,
      descricao,
      valor,
      data,
      categoriaId,
      fonteDestinoId
    });

    return res.json(atualizado);
  } catch (err) {
    return next(err);
  }
});

// DELETE /api/lancamentos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const todasParcelas = req.query.todasParcelas === 'true';
    const excluido = await LancamentoModel.excluir(id, req.usuarioId, todasParcelas);

    if (!excluido) return res.status(404).json({ erro: 'Lançamento não encontrado.' });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;