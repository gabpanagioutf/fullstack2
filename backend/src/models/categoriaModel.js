import pool from '../config/db.js';

export const CategoriaModel = {
  async listarPorUsuario(usuarioId) {
    const [rows] = await pool.execute(
      `SELECT c.id, c.nome, c.tipo, c.classificacao,
              COUNT(l.id) AS total_lancamentos
       FROM categorias c
       LEFT JOIN lancamentos l ON l.categoria_id = c.id
       WHERE c.usuario_id = ?
       GROUP BY c.id
       ORDER BY c.tipo ASC, c.nome ASC`,
      [usuarioId]
    );
    return rows;
  },

  async buscarPorId(id, usuarioId) {
    const [rows] = await pool.execute(
      'SELECT id, nome, tipo, classificacao FROM categorias WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0] || null;
  },

  async criar({ usuarioId, nome, tipo, classificacao = 'necessidade' }) {
    const [result] = await pool.execute(
      'INSERT INTO categorias (usuario_id, nome, tipo, classificacao) VALUES (?, ?, ?, ?)',
      [usuarioId, nome, tipo, classificacao]
    );
    return { id: result.insertId, nome, tipo, classificacao };
  },

  async atualizar(id, usuarioId, { nome, tipo, classificacao }) {
    const [result] = await pool.execute(
      'UPDATE categorias SET nome = ?, tipo = ?, classificacao = ? WHERE id = ? AND usuario_id = ?',
      [nome, tipo, classificacao || 'necessidade', id, usuarioId]
    );
    return result.affectedRows > 0;
  },

  async contarLancamentos(id, usuarioId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM lancamentos WHERE categoria_id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return rows[0].total;
  },

  async excluir(id, usuarioId) {
    const [result] = await pool.execute(
      'DELETE FROM categorias WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    return result.affectedRows > 0;
  }
};