import { useState, useEffect } from 'react';
import { apiRequest, formatarMoeda, formatarDataBR } from '../services/api';

export default function Faturas() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const res = await apiRequest('/relatorios/faturas?meses=4');
        setDados(res);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) return <div className="card">Calculando faturas e parcelas futuras...</div>;
  if (erro) return <div className="alert alert-error">{erro}</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Previsão de Faturas de Cartão de Crédito</h2>

      {dados.length === 0 ? (
        <div className="card">
          <p className="text-muted">Nenhum cartão de crédito cadastrado. Cadastre um em Fontes/Destinos.</p>
        </div>
      ) : (
        dados.map(({ cartao, faturas }) => (
          <div key={cartao.id} className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <h3>{cartao.nome}</h3>
                <span className="text-muted" style={{ fontSize: '0.88rem' }}>
                  Fechamento dia {cartao.diaFechamento} | Vencimento dia {cartao.diaVencimento}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>Limite Total: <strong>{formatarMoeda(cartao.limiteTotal)}</strong></div>
                <div className="text-red">Comprometido: <strong>{formatarMoeda(cartao.limiteUtilizado)}</strong></div>
                <div className="text-green">Disponível: <strong>{formatarMoeda(cartao.limiteDisponivel)}</strong></div>
              </div>
            </div>

            <div className="grid-2">
              {faturas.map((fat) => (
                <div key={fat.referencia} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>
                      Fatura {fat.referencia}{' '}
                      <span className={`badge ${fat.status === 'aberta' ? 'badge-saida' : 'badge-info'}`}>
                        {fat.status === 'aberta' ? 'Atual / Aberta' : 'Futura'}
                      </span>
                    </strong>
                    <strong className="text-red">{formatarMoeda(fat.total)}</strong>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                    Fecha em: {formatarDataBR(fat.fechamento)} | Vence em: {formatarDataBR(fat.vencimento)}
                  </p>

                  {fat.lancamentos.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Sem lançamentos nesta fatura.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Compra</th>
                          <th>Parcela</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fat.lancamentos.map((l) => (
                          <tr key={l.id}>
                            <td>
                              {l.descricao}
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {formatarDataBR(l.dataCompra)} • {l.categoria}
                              </div>
                            </td>
                            <td>{l.parcela}</td>
                            <td>{formatarMoeda(l.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}