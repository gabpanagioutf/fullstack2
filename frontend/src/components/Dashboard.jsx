import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, formatarMoeda, formatarDataBR, obterMesAtualRange } from '../services/api';

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [faturas, setFaturas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const { inicio, fim } = obterMesAtualRange();
        const [dadosLanc, dadosFat] = await Promise.all([
          apiRequest(`/lancamentos?inicio=${inicio}&fim=${fim}&limite=5`),
          apiRequest('/relatorios/faturas?meses=1')
        ]);
        setResumo(dadosLanc);
        setFaturas(dadosFat);
      } catch (err) {
        setErro(err.message || 'Erro ao carregar dashboard.');
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) return <div className="card">Carregando resumo financeiro...</div>;
  if (erro) return <div className="alert alert-error">{erro}</div>;

  const { totais, itens } = resumo;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Resumo do Mês Atual</h2>
        <Link to="/lancamentos" className="btn btn-primary">+ Novo Lançamento</Link>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="kpi-title">Entradas no Mês</div>
          <div className="kpi-value text-green">{formatarMoeda(totais.entradas)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Saídas no Mês</div>
          <div className="kpi-value text-red">{formatarMoeda(totais.saidas)}</div>
        </div>
        <div className="card">
          <div className="kpi-title">Saldo do Mês</div>
          <div className={`kpi-value ${totais.saldo >= 0 ? 'text-green' : 'text-red'}`}>
            {formatarMoeda(totais.saldo)}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '0.8rem' }}>Últimos Lançamentos</h3>
          {itens.length === 0 ? (
            <p className="text-muted">Nenhuma movimentação registrada neste mês.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((l) => (
                    <tr key={l.id}>
                      <td>{formatarDataBR(l.data)}</td>
                      <td>
                        {l.descricao}{' '}
                        {l.total_parcelas > 1 && (
                          <span className="badge badge-info">
                            {l.parcela_atual}/{l.total_parcelas}
                          </span>
                        )}
                      </td>
                      <td className={l.tipo === 'entrada' ? 'text-green' : 'text-red'}>
                        {l.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(l.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.8rem' }}>Cartões de Crédito (Fatura Aberta)</h3>
          {faturas.length === 0 ? (
            <p className="text-muted">Nenhum cartão de crédito cadastrado.</p>
          ) : (
            faturas.map(({ cartao, faturas: listaFat }) => {
              const atual = listaFat[0];
              return (
                <div key={cartao.id} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{cartao.nome}</strong>
                    <span className="text-red"><strong>{formatarMoeda(atual?.total || 0)}</strong></span>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                    Vencimento: {formatarDataBR(atual?.vencimento)} | Limite Disponível:{' '}
                    <strong>{formatarMoeda(cartao.limiteDisponivel)}</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}