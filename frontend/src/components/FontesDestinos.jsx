import { useState, useEffect } from 'react';
import { apiRequest, formatarMoeda } from '../services/api';

const FORM_INICIAL = {
  nome: '',
  tipo: 'conta',
  dia_fechamento: '',
  dia_vencimento: '',
  limite: '',
  reserva: false
};

export default function FontesDestinos() {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);

  const carregar = async () => {
    try {
      setCarregando(true);
      const dados = await apiRequest('/fontes-destinos');
      setLista(dados);
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
        await apiRequest(`/fontes-destinos/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
      } else {
        await apiRequest('/fontes-destinos', {
          method: 'POST',
          body: JSON.stringify(form)
        });
      }
      setForm(FORM_INICIAL);
      setEditandoId(null);
      carregar();
    } catch (err) {
      const primeiroCampo = err.campos ? Object.values(err.campos)[0] : '';
      setErro(primeiroCampo || err.message);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setForm({
      nome: item.nome,
      tipo: item.tipo,
      dia_fechamento: item.dia_fechamento || '',
      dia_vencimento: item.dia_vencimento || '',
      limite: item.limite || '',
      reserva: Boolean(item.reserva)
    });
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir esta fonte/destino?')) return;
    setErro('');
    try {
      await apiRequest(`/fontes-destinos/${id}`, { method: 'DELETE' });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Fontes e Destinos</h2>
      {erro && <div className="alert alert-error">{erro}</div>}

      <div className="card">
        <h3 style={{ marginBottom: '0.8rem' }}>
          {editandoId ? 'Editar Fonte/Destino' : 'Nova Fonte ou Destino'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row" style={{ marginBottom: '0.8rem' }}>
            <div>
              <label>Nome</label>
              <input
                type="text"
                className="form-control"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Nubank, Conta Itaú, Salário..."
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
                <option value="conta">Conta (Corrente / Poupança / Dinheiro)</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="renda">Fonte de Renda</option>
              </select>
            </div>
          </div>

          {form.tipo === 'cartao_credito' && (
            <div className="form-row" style={{ marginBottom: '0.8rem' }}>
              <div>
                <label>Dia de Fechamento (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  value={form.dia_fechamento}
                  onChange={(e) => setForm({ ...form, dia_fechamento: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Dia de Vencimento (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  className="form-control"
                  value={form.dia_vencimento}
                  onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                  required
                />
              </div>
              <div>
                <label>Limite Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={form.limite}
                  onChange={(e) => setForm({ ...form, limite: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {form.tipo === 'conta' && (
            <div className="form-group">
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.reserva}
                  onChange={(e) => setForm({ ...form, reserva: e.target.checked })}
                />
                Considerar esta conta como Reserva de Emergência (Saúde Financeira)
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editandoId ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
            {editandoId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditandoId(null);
                  setForm(FORM_INICIAL);
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
          <p>Carregando...</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Detalhes</th>
                  <th>Lançamentos</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.nome}</strong>{' '}
                      {item.reserva && <span className="badge badge-entrada">Reserva</span>}
                    </td>
                    <td>{item.tipo}</td>
                    <td>
                      {item.tipo === 'cartao_credito'
                        ? `Fecha dia ${item.dia_fechamento} | Vence dia ${item.dia_vencimento} | Limite: ${formatarMoeda(item.limite)}`
                        : '-'}
                    </td>
                    <td>{item.total_lancamentos}</td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => iniciarEdicao(item)} className="btn btn-secondary btn-sm">
                        Editar
                      </button>
                      <button onClick={() => handleExcluir(item.id)} className="btn btn-danger btn-sm">
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