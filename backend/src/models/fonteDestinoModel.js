import pool from '../config/db.js';

export const FonteDestinoModel = {
  async listarPorUsuario(usuarioId) {
    const [rows] = await pool.execute(
      `SELECT f.id, f.nome, f.tipo, f.dia_fechamento, f.dia_vencimento, f.limite, f.reserva,
              COUNT(l.id) AS total_lancamentos
       FROM fontes_destinos f
       LEFT JOIN lancamentos l ON l.fonte_destino_id = f.id
       WHERE f.usuario_id = ?
       GROUP BY f.id
       ORDER BY f.tipo ASC, f.nome ASC`,
      [usuarioId]
    );
    return rows.map((r) => ({ ...r, reserva: Boolean(r.reserva) }));
  },

  async buscarPorId(id, usuarioId) {
    const [rows] = await pool.execute(
      `SELECT id, nome, tipo, dia_fechamento, dia_vencimento, limite, reserva
       FROM fontes_destinos WHERE id = ? AND usuario_id = ?`,
      [id, usuarioId]
    );
    if (!rows[0]) return null;
    return { ...rows[0], reserva: Boolean(rows[0].reserva) };
  },

  async criar({ usuarioId, nome, tipo, diaFechamento, diaVencimento, limite, reserva = false }) {
    const isCartao = tipo === 'cartao_credito';
    const [result] = await pool.execute(
      `INSERT INTO fontes_destinos
       (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite, reserva)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId,
        nome,
        tipo,
        isCartao ? diaFechamento : null,
        isCartao ? diaVencimento : null,
        isCartao ? limite : null,
        tipo === 'conta' ? Boolean(reserva) : false
      ]
    );
    return this.buscarPorId(result.insertId, usuarioId);
  },

  async atualizar(id, usuarioId, { nome, tipo, diaFechamento, diaVencimento, limite, reserva = false }) {
    const isCartao = tipo === 'cartao_credito';
    const [result] = await pool.execute(
      `UPDATE fontes_destinos
       SET nome = ?, tipo = ?, dia_fechamento = ?, dia_vencimento = ?, limite = ?, reserva = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        nome,
        tipo,
        isCartao ? diaFechamento : null,
        isCartao ? diaVencimento : null,
        isCartao ? limite : null,
        tipo === 'conta' ? Boolean(reserva) : false,
        id,
        usuarioId
      ]
    );
    return result.affectedRows > 0;
  },

  async contarLancamentos(id, usuarioId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM lancamentos WHERE fonte_destino_id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0].total;
  },

  async excluir(id, usuarioId) {
    const [result] = await pool.execute(
      'DELETE FROM fontes_destinos WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return result.affectedRows > 0;
  }
};