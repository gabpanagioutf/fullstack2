import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({ nome: '', tipo: 'saida', classificacao: 'necessidade' });

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await apiRequest('/categorias');
      setCategorias(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await apiRequest(`/categorias/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiRequest('/categorias', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setForm({ nome: '', tipo: 'saida', classificacao: 'necessidade' });
      setEditandoId(null);
      carregar();
    } catch (err) {
      setErro(err.campos?.nome || err.message);
    }
  };

  const iniciarEdicao = (cat) => {
    setEditandoId(cat.id);
    setForm({ nome: cat.nome, tipo: cat.tipo, classificacao: cat.classificacao || 'necessidade' });
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta categoria?')) return;
    setErro('');
    try {
      await apiRequest(`/categorias/${id}`, { method: 'DELETE' });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Categorias</h2>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <h3 style={{ marginBottom: '0.8rem' }}>
          {editandoId ? 'Editar Categoria' : 'Nova Categoria'}
        </h3>
        <form onSubmit={handleSubmit} className="form-row">
          <div>
            <label>Nome</label>
            <input
              type="text"
              className="form-control"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Academia, Investimentos..."
              required
            />
          </div>
          <div>
            <label>Tipo</label>
            <select
              className="form-control"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="saida">Saída</option>
              <option value="entrada">Entrada</option>
            </select>
          </div>
          <div>
            <label>Regra 50/30/20</label>
            <select
              className="form-control"
              value={form.classificacao}
              onChange={(e) => setForm({ ...form, classificacao: e.target.value })}
            >
              <option value="necessidade">Necessidade (50%)</option>
              <option value="desejo">Desejo (30%)</option>
              <option value="poupanca">Poupança / Renda (20%)</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editandoId ? 'Salvar' : 'Adicionar'}
            </button>
            {editandoId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditandoId(null);
                  setForm({ nome: '', tipo: 'saida', classificacao: 'necessidade' });
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        {carregando ? (
          <p>Carregando categorias...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Classificação</th>
                  <th>Lançamentos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td>
                      <span className={`badge ${c.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida'}`}>
                        {c.tipo}
                      </span>
                    </td>
                    <td>{c.classificacao}</td>
                    <td>{c.total_lancamentos}</td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => iniciarEdicao(c)} className="btn btn-secondary btn-sm">
                        Editar
                      </button>
                      <button onClick={() => handleExcluir(c.id)} className="btn btn-danger btn-sm">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}