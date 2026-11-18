import { useState, useEffect } from 'react';
import { apiRequest, formatarMoeda, formatarDataBR, obterMesAtualRange } from '../services/api';

export default function Lancamentos() {
  const periodoPadrao = obterMesAtualRange();
  const [filtros, setFiltros] = useState({
    inicio: periodoPadrao.inicio,
    fim: periodoPadrao.fim,
    tipo: '',
    categoriaId: '',
    fonteDestinoId: '',
    pagina: 1
  });

  const [dados, setDados] = useState({
    itens: [],
    totais: { entradas: 0, saidas: 0, saldo: 0 },
    paginacao: { pagina: 1, totalPaginas: 1, totalRegistros: 0 }
  });

  const [categorias, setCategorias] = useState([]);
  const [fontes, setFontes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [errosForm, setErrosForm] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  const [form, setForm] = useState({
    tipo: 'saida',
    descricao: '',
    valor: '',
    data: new Date().toISOString().slice(0, 10),
    categoria_id: '',
    fonte_destino_id: '',
    total_parcelas: 1
  });

  useEffect(() => {
    async function carregarAuxiliares() {
      try {
        const [cats, fts] = await Promise.all([
          apiRequest('/categorias'),
          apiRequest('/fontes-destinos')
        ]);
        setCategorias(cats);
        setFontes(fts);
      } catch (err) {
        setErro(err.message);
      }
    }
    carregarAuxiliares();
  }, []);

  const carregarLancamentos = async () => {
    try {
      setCarregando(true);
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([k, v]) => {
        if (v !== '' && v !== null) params.append(k, v);
      });
      const res = await apiRequest(`/lancamentos?${params.toString()}`);
      setDados(res);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarLancamentos();
  }, [filtros]);

  const categoriasFiltradasForm = categorias.filter((c) => c.tipo === form.tipo);
  const fonteSelecionada = fontes.find((f) => String(f.id) === String(form.fonte_destino_id));
  const permiteParcelar = form.tipo === 'saida' && fonteSelecionada?.tipo === 'cartao_credito' && !editandoId;

  const handleSalvar = async (e) => {
    e.preventDefault();
    setErro('');
    setErrosForm({});

    try {
      const payload = {
        ...form,
        valor: Number(form.valor),
        categoria_id: Number(form.categoria_id),
        fonte_destino_id: Number(form.fonte_destino_id),
        total_parcelas: permiteParcelar ? Number(form.total_parcelas) : 1
      };

      if (editandoId) {
        await apiRequest(`/lancamentos/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/lancamentos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setEditandoId(null);
      setForm({
        tipo: 'saida',
        descricao: '',
        valor: '',
        data: new Date().toISOString().slice(0, 10),
        categoria_id: '',
        fonte_destino_id: '',
        total_parcelas: 1
      });
      carregarLancamentos();
    } catch (err) {
      setErro(err.message);
      if (err.campos) setErrosForm(err.campos);
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setForm({
      tipo: item.tipo,
      descricao: item.descricao,
      valor: item.valor,
      data: String(item.data).slice(0, 10),
      categoria_id: item.categoria_id,
      fonte_destino_id: item.fonte_destino_id,
      total_parcelas: 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (item) => {
    let todasParcelas = false;
    if (item.total_parcelas > 1 && item.grupo_parcelamento) {
      const escolha = window.confirm(
        `Este lançamento faz parte de uma compra em ${item.total_parcelas}x.\n\nClique em OK para excluir TODAS as parcelas da compra, ou em Cancelar para escolher excluir apenas esta parcela.`
      );
      if (escolha) {
        todasParcelas = true;
      } else if (!window.confirm('Deseja excluir APENAS esta parcela?')) {
        return;
      }
    } else if (!window.confirm(`Excluir "${item.descricao}"?`)) {
      return;
    }

    try {
      await apiRequest(`/lancamentos/${item.id}?todasParcelas=${todasParcelas}`, {
        method: 'DELETE'
      });
      carregarLancamentos();
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Lançamentos Financeiros</h2>
      {erro && <div className="alert alert-error">{erro}</div>}

      {/* Formulário de Inserção/Edição */}
      <div className="card">
        <h3 style={{ marginBottom: '0.8rem' }}>
          {editandoId ? 'Editar Lançamento' : 'Novo Lançamento'}
        </h3>
        <form onSubmit={handleSalvar}>
          <div className="form-row" style={{ marginBottom: '0.8rem' }}>
            <div>
              <label>Tipo</label>
              <select
                className="form-control"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value, categoria_id: '' })}
              >
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label>Descrição</label>
              <input
                type="text"
                className="form-control"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex.: Supermercado, Salário, Notebook..."
                required
              />
              {errosForm.descricao && <span className="field-error">{errosForm.descricao}</span>}
            </div>
            <div>
              <label>Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                required
              />
              {errosForm.valor && <span className="field-error">{errosForm.valor}</span>}
            </div>
            <div>
              <label>Data</label>
              <input
                type="date"
                className="form-control"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                required
              />
              {errosForm.data && <span className="field-error">{errosForm.data}</span>}
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Categoria ({form.tipo})</label>
              <select
                className="form-control"
                value={form.categoria_id}
                onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {categoriasFiltradasForm.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {errosForm.categoria_id && <span className="field-error">{errosForm.categoria_id}</span>}
            </div>

            <div>
              <label>{form.tipo === 'entrada' ? 'Fonte' : 'Destino / Pagamento'}</label>
              <select
                className="form-control"
                value={form.fonte_destino_id}
                onChange={(e) => setForm({ ...form, fonte_destino_id: e.target.value, total_parcelas: 1 })}
                required
              >
                <option value="">Selecione...</option>
                {fontes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} ({f.tipo === 'cartao_credito' ? 'Cartão' : f.tipo})
                  </option>
                ))}
              </select>
              {errosForm.fonte_destino_id && (
                <span className="field-error">{errosForm.fonte_destino_id}</span>
              )}
            </div>

            {permiteParcelar && (
              <div>
                <label>Parcelas (1 a 48x)</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  className="form-control"
                  value={form.total_parcelas}
                  onChange={(e) => setForm({ ...form, total_parcelas: e.target.value })}
                />
                {errosForm.total_parcelas && (
                  <span className="field-error">{errosForm.total_parcelas}</span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary">
                {editandoId ? 'Atualizar' : 'Registrar'}
              </button>
              {editandoId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditandoId(null)}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div className="card">
        <h4 style={{ marginBottom: '0.6rem' }}>Filtros do Período</h4>
        <div className="form-row">
          <div>
            <label>Início</label>
            <input
              type="date"
              className="form-control"
              value={filtros.inicio}
              onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value, pagina: 1 })}
            />
          </div>
          <div>
            <label>Fim</label>
            <input
              type="date"
              className="form-control"
              value={filtros.fim}
              onChange={(e) => setFiltros({ ...filtros, fim: e.target.value, pagina: 1 })}
            />
          </div>
          <div>
            <label>Tipo</label>
            <select
              className="form-control"
              value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value, pagina: 1 })}
            >
              <option value="">Todos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          <div>
            <label>Categoria</label>
            <select
              className="form-control"
              value={filtros.categoriaId}
              onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value, pagina: 1 })}
            >
              <option value="">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Fonte/Destino</label>
            <select
              className="form-control"
              value={filtros.fonteDestinoId}
              onChange={(e) => setFiltros({ ...filtros, fonteDestinoId: e.target.value, pagina: 1 })}
            >
              <option value="">Todos</option>
              {fontes.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Totais do Período */}
      <div className="grid-3">
        <div className="card">
          <div className="kpi-title">Total Entradas</div>
          <div className="kpi-value text-green">{formatarMoeda(dados.totais.entradas)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Total Saídas</div>
          <div className="kpi-value text-red">{formatarMoeda(dados.totais.saidas)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Saldo do Período</div>
          <div className={`kpi-value ${dados.totais.saldo >= 0 ? 'text-green' : 'text-red'}`}>
            {formatarMoeda(dados.totais.saldo)}
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="card">
        {carregando ? (
          <p>Carregando lançamentos...</p>
        ) : dados.itens.length === 0 ? (
          <p className="text-muted">Nenhum lançamento encontrado para os filtros informados.</p>
        ) : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Fonte/Destino</th>
                    <th>Valor</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itens.map((item) => (
                    <tr key={item.id}>
                      <td>{formatarDataBR(item.data)}</td>
                      <td>
                        <strong>{item.descricao}</strong>{' '}
                        {item.total_parcelas > 1 && (
                          <span className="badge badge-info">
                            Parcela {item.parcela_atual}/{item.total_parcelas}
                          </span>
                        )}
                      </td>
                      <td>{item.categoria_nome}</td>
                      <td>{item.fonte_destino_nome}</td>
                      <td className={item.tipo === 'entrada' ? 'text-green' : 'text-red'}>
                        <strong>
                          {item.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(item.valor)}
                        </strong>
                      </td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => iniciarEdicao(item)} className="btn btn-secondary btn-sm">
                          Editar
                        </button>
                        <button onClick={() => handleExcluir(item)} className="btn btn-danger btn-sm">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span className="text-muted" style={{ fontSize: '0.88rem' }}>
                Página {dados.paginacao.pagina} de {dados.paginacao.totalPaginas} ({dados.paginacao.totalRegistros} registros)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={dados.paginacao.pagina <= 1}
                  onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina - 1 })}
                >
                  Anterior
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={dados.paginacao.pagina >= dados.paginacao.totalPaginas}
                  onClick={() => setFiltros({ ...filtros, pagina: filtros.pagina + 1 })}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}