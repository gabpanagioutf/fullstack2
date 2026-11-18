import crypto from 'crypto';
import pool from '../config/db.js';
import { dividirParcelas } from '../config/utils.js';

export const LancamentoModel = {
  async listar(usuarioId, { inicio, fim, tipo, categoriaId, fonteDestinoId, pagina = 1, limite = 15 }) {
    const condicoes = ['l.usuario_id = ?'];
    const params = [usuarioId];

    if (inicio) {
      condicoes.push('l.data >= ?');
      params.push(inicio);
    }
    if (fim) {
      condicoes.push('l.data <= ?');
      params.push(fim);
    }
    if (tipo && ['entrada', 'saida'].includes(tipo)) {
      condicoes.push('l.tipo = ?');
      params.push(tipo);
    }
    if (categoriaId) {
      condicoes.push('l.categoria_id = ?');
      params.push(Number(categoriaId));
    }
    if (fonteDestinoId) {
      condicoes.push('l.fonte_destino_id = ?');
      params.push(Number(fonteDestinoId));
    }

    const where = condicoes.join(' AND ');
    const pageNum = Math.max(1, Number(pagina) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limite) || 15));
    const offset = (pageNum - 1) * limitNum;

    // Totais e contagem do período filtrado
    const [totaisRows] = await pool.execute(
      `SELECT
         COUNT(*) AS totalRegistros,
         COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE 0 END), 0) AS totalEntradas,
         COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor ELSE 0 END), 0) AS totalSaidas
       FROM lancamentos l
       WHERE ${where}`,
      params
    );

    const { totalRegistros, totalEntradas, totalSaidas } = totaisRows[0];

    // Lista paginada
    const [itens] = await pool.query(
      `SELECT l.id, l.tipo, l.descricao, l.valor, l.data,
              l.categoria_id, c.nome AS categoria_nome,
              l.fonte_destino_id, f.nome AS fonte_destino_nome, f.tipo AS fonte_destino_tipo,
              l.parcela_atual, l.total_parcelas, l.grupo_parcelamento
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id
       WHERE ${where}
       ORDER BY l.data DESC, l.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    return {
      itens,
      totais: {
        entradas: Number(totalEntradas),
        saidas: Number(totalSaidas),
        saldo: Number((Number(totalEntradas) - Number(totalSaidas)).toFixed(2))
      },
      paginacao: {
        pagina: pageNum,
        limite: limitNum,
        totalRegistros: Number(totalRegistros),
        totalPaginas: Math.max(1, Math.ceil(Number(totalRegistros) / limitNum))
      }
    };
  },

  async buscarPorId(id, usuarioId) {
    const [rows] = await pool.execute(
      `SELECT l.*, c.nome AS categoria_nome, f.nome AS fonte_destino_nome, f.tipo AS fonte_destino_tipo
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id
       WHERE l.id = ? AND l.usuario_id = ?`,
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  async criar({ usuarioId, tipo, descricao, valor, data, categoriaId, fonteDestinoId, totalParcelas = 1 }) {
    const parcelas = Number(totalParcelas) || 1;
    const valoresParcelas = dividirParcelas(valor, parcelas);
    const grupoParcelamento = parcelas > 1 ? crypto.randomUUID() : null;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const idsCriados = [];

      for (let i = 0; i < parcelas; i++) {
        const [res] = await conn.execute(
          `INSERT INTO lancamentos
           (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id, parcela_atual, total_parcelas, grupo_parcelamento)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            usuarioId,
            tipo,
            descricao,
            valoresParcelas[i],
            data,
            categoriaId,
            fonteDestinoId,
            i + 1,
            parcelas,
            grupoParcelamento
          ]
        );
        idsCriados.push(res.insertId);
      }

      await conn.commit();
      return this.buscarPorId(idsCriados[0], usuarioId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async atualizar(id, usuarioId, { tipo, descricao, valor, data, categoriaId, fonteDestinoId }) {
    const [result] = await pool.execute(
      `UPDATE lancamentos
       SET tipo = ?, descricao = ?, valor = ?, data = ?, categoria_id = ?, fonte_destino_id = ?
       WHERE id = ? AND usuario_id = ?`,
      [tipo, descricao, valor, data, categoriaId, fonteDestinoId, id, usuarioId]
    );
    if (result.affectedRows === 0) return null;
    return this.buscarPorId(id, usuarioId);
  },

  async excluir(id, usuarioId, todasParcelas = false) {
    const lancamento = await this.buscarPorId(id, usuarioId);
    if (!lancamento) return false;

    if (todasParcelas && lancamento.grupo_parcelamento) {
      const [result] = await pool.execute(
        'DELETE FROM lancamentos WHERE grupo_parcelamento = ? AND usuario_id = ?',
        [lancamento.grupo_parcelamento, usuarioId]
      );
      return result.affectedRows > 0;
    }

    const [result] = await pool.execute(
      'DELETE FROM lancamentos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return result.affectedRows > 0;
  }
};