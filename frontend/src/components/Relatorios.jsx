import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { apiRequest, formatarMoeda, formatarDataBR, obterMesAtualRange } from '../services/api';

const CORES = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#4f46e5'];

export default function Relatorios() {
  const padrao = obterMesAtualRange();
  const [inicio, setInicio] = useState(padrao.inicio);
  const [fim, setFim] = useState(padrao.fim);
  const [relCat, setRelCat] = useState(null);
  const [relFonte, setRelFonte] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro('');
      const [rCat, rFonte] = await Promise.all([
        apiRequest(`/relatorios/categorias?inicio=${inicio}&fim=${fim}`),
        apiRequest(`/relatorios/fontes-destinos?inicio=${inicio}&fim=${fim}`)
      ]);
      setRelCat(rCat);
      setRelFonte(rFonte);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [inicio, fim]);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Relatórios Financeiros</h2>

      <div className="card">
        <div className="form-row">
          <div>
            <label>Data Inicial</label>
            <input type="date" className="form-control" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label>Data Final</label>
            <input type="date" className="form-control" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>
      </div>

      {erro && <div className="alert alert-error">{erro}</div>}
      {carregando ? (
        <div className="card">Gerando relatórios...</div>
      ) : (
        <>
          {/* RF7 - Relatório por Categoria */}
          <div className="card">
            <h3>1. Saídas por Categoria (vs. Período Anterior: {formatarDataBR(relCat.periodoAnterior.inicio)} a {formatarDataBR(relCat.periodoAnterior.fim)})</h3>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Total de Saídas: <strong>{formatarMoeda(relCat.totalSaidas)}</strong> | Total de Entradas: <strong>{formatarMoeda(relCat.totalEntradas)}</strong>
            </p>

            {relCat.categorias.length === 0 ? (
              <p className="text-muted">Nenhuma saída registrada neste período.</p>
            ) : (
              <div className="grid-2" style={{ alignItems: 'center' }}>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Categoria</th>
                        <th>Total</th>
                        <th>%</th>
                        <th>Anterior</th>
                        <th>Variação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relCat.categorias.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.nome}</strong></td>
                          <td>{formatarMoeda(c.total)}</td>
                          <td>{c.percentual}%</td>
                          <td>{formatarMoeda(c.periodoAnterior)}</td>
                          <td className={c.variacaoPercentual > 0 ? 'text-red' : 'text-green'}>
                            {c.variacaoPercentual > 0 ? `+${c.variacaoPercentual}%` : `${c.variacaoPercentual}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={relCat.categorias}
                        dataKey="total"
                        nameKey="nome"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        label={({ nome, percentual }) => `${nome} (${percentual}%)`}
                      >
                        {relCat.categorias.map((_, idx) => (
                          <Cell key={idx} fill={CORES[idx % CORES.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatarMoeda(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* RF8 - Relatório por Fonte/Destino */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>2. Movimentação por Fonte / Destino</h3>
            <div className="grid-2" style={{ alignItems: 'center' }}>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fonte / Destino</th>
                      <th>Tipo</th>
                      <th>Entradas</th>
                      <th>Saídas</th>
                      <th>Saldo (Contas)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relFonte.itens.map((item) => (
                      <tr key={item.id}>
                        <td><strong>{item.nome}</strong></td>
                        <td>{item.tipo}</td>
                        <td className="text-green">{formatarMoeda(item.entradas)}</td>
                        <td className="text-red">{formatarMoeda(item.saidas)}</td>
                        <td>
                          {item.saldo !== null ? (
                            <strong className={item.saldo >= 0 ? 'text-green' : 'text-red'}>
                              {formatarMoeda(item.saldo)}
                            </strong>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={relFonte.itens}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip formatter={(v) => formatarMoeda(v)} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#16a34a" />
                    <Bar dataKey="saidas" name="Saídas" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}