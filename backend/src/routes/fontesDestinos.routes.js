import { Router } from 'express';
import { FonteDestinoModel } from '../models/fonteDestinoModel.js';
import { sanitizarTexto } from '../config/utils.js';

const router = Router();

function validarFonteDestino(body) {
  const nome = sanitizarTexto(body.nome);
  const tipo = body.tipo;
  const diaFechamento = body.dia_fechamento ? Number(body.dia_fechamento) : null;
  const diaVencimento = body.dia_vencimento ? Number(body.dia_vencimento) : null;
  const limite = body.limite !== undefined && body.limite !== '' ? Number(body.limite) : null;
  const reserva = Boolean(body.reserva);

  const campos = {};
  if (!nome) campos.nome = 'Nome é obrigatório.';
  if (!['renda', 'conta', 'cartao_credito'].includes(tipo)) {
    campos.tipo = 'Tipo inválido.';
  }

  if (tipo === 'cartao_credito') {
    if (!diaFechamento || diaFechamento < 1 || diaFechamento > 31) {
      campos.dia_fechamento = 'Dia de fechamento obrigatório (1 a 31).';
    }
    if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
      campos.dia_vencimento = 'Dia de vencimento obrigatório (1 a 31).';
    }
    if (!limite || limite <= 0) {
      campos.limite = 'Limite do cartão deve ser maior que zero.';
    }
  }

  return {
    campos,
    dados: { nome, tipo, diaFechamento, diaVencimento, limite, reserva }
  };
}

// GET /api/fontes-destinos
router.get('/', async (req, res, next) => {
  try {
    const lista = await FonteDestinoModel.listarPorUsuario(req.usuarioId);
    return res.json(lista);
  } catch (err) {
    return next(err);
  }
});

// POST /api/fontes-destinos
router.post('/', async (req, res, next) => {
  try {
    const { campos, dados } = validarFonteDestino(req.body);
    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    const criado = await FonteDestinoModel.criar({ usuarioId: req.usuarioId, ...dados });
    return res.status(201).json(criado);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        erro: 'Fonte/Destino duplicado.',
        campos: { nome: 'Você já possui uma fonte/destino com este nome.' }
      });
    }
    return next(err);
  }
});

// PUT /api/fontes-destinos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { campos, dados } = validarFonteDestino(req.body);
    if (Object.keys(campos).length > 0) {
      return res.status(400).json({ erro: 'Dados inválidos.', campos });
    }

    const atualizado = await FonteDestinoModel.atualizar(id, req.usuarioId, dados);
    if (!atualizado) return res.status(404).json({ erro: 'Fonte/Destino não encontrado.' });

    const item = await FonteDestinoModel.buscarPorId(id, req.usuarioId);
    return res.json(item);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ erro: 'Já existe outro registro com este nome.' });
    }
    return next(err);
  }
});

// DELETE /api/fontes-destinos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existente = await FonteDestinoModel.buscarPorId(id, req.usuarioId);
    if (!existente) return res.status(404).json({ erro: 'Fonte/Destino não encontrado.' });

    const emUso = await FonteDestinoModel.contarLancamentos(id, req.usuarioId);
    if (emUso > 0) {
      return res.status(409).json({
        erro: `Não é possível excluir: existem ${emUso} lançamento(s) vinculados.`
      });
    }

    await FonteDestinoModel.excluir(id, req.usuarioId);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

export default router;