import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { apiRequest, formatarMoeda } from '../services/api';

export default function SaudeFinanceira() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);
        const res = await apiRequest('/saude-financeira');
        setDados(res);
      } catch (err) {
        setErro(err.message);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  if (carregando) return <div className="card">Analisando indicadores financeiros...</div>;
  if (erro) return <div className="alert alert-error">{erro}</div>;

  const { indicadores, projecao, dicas, avisoLegal } = dados;

  return (
    <div>
      <h2 style={{ marginBottom: '0.5rem' }}>Saúde Financeira e Projeções</h2>
      <div className="alert alert-warning">{avisoLegal}</div>

      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="card">
          <div className="kpi-title">Taxa Média de Poupança</div>
          <div className={`kpi-value ${indicadores.taxaPoupanca >= 10 ? 'text-green' : 'text-amber'}`}>
            {indicadores.taxaPoupanca}%
          </div>
        </div>
        <div className="card">
          <div className="kpi-title">Comprometimento Cartão</div>
          <div className={`kpi-value ${indicadores.comprometimentoCartao <= 35 ? 'text-green' : 'text-red'}`}>
            {indicadores.comprometimentoCartao}%
          </div>
        </div>
        <div className="card">
          <div className="kpi-title">Reserva de Emergência</div>
          <div className="kpi-value">{indicadores.mesesReserva} meses</div>
          <div className="text-muted" style={{ fontSize: '0.82rem' }}>
            Saldo: {formatarMoeda(indicadores.saldoReserva)}
          </div>
        </div>
        <div className="card">
          <div className="kpi-title">Regra 50 / 30 / 20 (Atual)</div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Necessidades: <strong>{indicadores.regra503020.necessidades}%</strong><br />
            Desejos: <strong>{indicadores.regra503020.desejos}%</strong>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '0.8rem' }}>Projeção de Saldo (Próximos 4 Meses)</h3>
          <div style={{ width: '100%', height: 270 }}>
            <ResponsiveContainer>
              <LineChart data={projecao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(v) => formatarMoeda(v)} />
                <Line
                  type="monotone"
                  dataKey="saldoProjetado"
                  name="Saldo Acumulado Projetado"
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '0.8rem' }}>Diagnóstico e Dicas Personalizadas</h3>
          {dicas.map((dica, idx) => (
            <div
              key={idx}
              className={`alert ${dica.tipo === 'positivo' ? 'alert-success' : 'alert-warning'}`}
            >
              <strong>{dica.titulo}</strong>
              <p style={{ marginTop: '0.2rem' }}>{dica.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}