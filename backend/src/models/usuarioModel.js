import pool from '../config/db.js';

export const UsuarioModel = {
  async criarComPadroes({ nome, email, cpf, senhaHash }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [resUser] = await conn.execute(
        'INSERT INTO usuarios (nome, email, cpf, senha_hash) VALUES (?, ?, ?, ?)',
        [nome, email, cpf, senhaHash]
      );
      const usuarioId = resUser.insertId;

      // Cria categorias padrão (item 10.4)
      const categoriasPadrao = [
        [usuarioId, 'Salário', 'entrada', 'poupanca'],
        [usuarioId, 'Outros Ganhos', 'entrada', 'poupanca'],
        [usuarioId, 'Alimentação', 'saida', 'necessidade'],
        [usuarioId, 'Moradia', 'saida', 'necessidade'],
        [usuarioId, 'Saúde', 'saida', 'necessidade'],
        [usuarioId, 'Mobilidade', 'saida', 'necessidade'],
        [usuarioId, 'Educação', 'saida', 'necessidade'],
        [usuarioId, 'Lazer', 'saida', 'desejo'],
        [usuarioId, 'Outros', 'saida', 'desejo']
      ];

      await conn.query(
        'INSERT INTO categorias (usuario_id, nome, tipo, classificacao) VALUES ?',
        [categoriasPadrao]
      );

      // Cria fonte/destino padrão (item 10.4)
      await conn.execute(
        'INSERT INTO fontes_destinos (usuario_id, nome, tipo, reserva) VALUES (?, ?, ?, ?)',
        [usuarioId, 'Conta Corrente', 'conta', false]
      );

      await conn.commit();
      return { id: usuarioId, nome, email };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  async buscarPorEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, cpf, senha_hash FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id) {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, cpf, criado_em FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }
};