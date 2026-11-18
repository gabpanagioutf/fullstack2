import pool from '../config/db.js';
import { calcularFatura } from '../config/utils.js';

function calcularPeriodoAnterior(inicio, fim) {
  const dtInicio = new Date(`${inicio}T00:00:00Z`);
  const dtFim = new Date(`${fim}T00:00:00Z`);
  const diffDias = Math.round((dtFim - dtInicio) / (1000 * 60 * 60 * 24)) + 1;

  const antFim = new Date(dtInicio);
  antFim.setUTCDate(antFim.getUTCDate() - 1);

  const antInicio = new Date(antFim);
  antInicio.setUTCDate(antInicio.getUTCDate() - (diffDias - 1));

  return {
    inicio: antInicio.toISOString().slice(0, 10),
    fim: antFim.toISOString().slice(0, 10)
  };
}

export const RelatorioModel = {
  // RF7 - Relatório por Categoria
  async porCategoria(usuarioId, inicio, fim) {
    const anterior = calcularPeriodoAnterior(inicio, fim);

    const [saidasAtuais] = await pool.execute(
      `SELECT c.id, c.nome, COALESCE(SUM(l.valor), 0) AS total
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'saida' AND l.data BETWEEN ? AND ?
       GROUP BY c.id, c.nome
       ORDER BY total DESC`,
      [usuarioId, inicio, fim]
    );

    const [saidasAnteriores] = await pool.execute(
      `SELECT categoria_id, COALESCE(SUM(valor), 0) AS total
       FROM lancamentos
       WHERE usuario_id = ? AND tipo = 'saida' AND data BETWEEN ? AND ?
       GROUP BY categoria_id`,
      [usuarioId, anterior.inicio, anterior.fim]
    );

    const [entradas] = await pool.execute(
      `SELECT c.id, c.nome, COALESCE(SUM(l.valor), 0) AS total
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'entrada' AND l.data BETWEEN ? AND ?
       GROUP BY c.id, c.nome
       ORDER BY total DESC`,
      [usuarioId, inicio, fim]
    );

    const mapaAnterior = new Map(saidasAnteriores.map((r) => [r.categoria_id, Number(r.total)]));
    const totalSaidas = saidasAtuais.reduce((acc, item) => acc + Number(item.total), 0);
    const totalEntradas = entradas.reduce((acc, item) => acc + Number(item.total), 0);

    const categoriasSaida = saidasAtuais.map((item) => {
      const total = Number(item.total);
      const valorAnterior = mapaAnterior.get(item.id) || 0;
      const variacaoPercentual =
        valorAnterior > 0
          ? Number((((total - valorAnterior) / valorAnterior) * 100).toFixed(1))
          : total > 0
            ? 100
            : 0;

      return {
        id: item.id,
        nome: item.nome,
        total,
        percentual: totalSaidas > 0 ? Number(((total / totalSaidas) * 100).toFixed(2)) : 0,
        periodoAnterior: valorAnterior,
        variacaoPercentual
      };
    });

    return {
      periodo: { inicio, fim },
      periodoAnterior: anterior,
      totalSaidas: Number(totalSaidas.toFixed(2)),
      totalEntradas: Number(totalEntradas.toFixed(2)),
      categorias: categoriasSaida,
      entradas: entradas.map((e) => ({ id: e.id, nome: e.nome, total: Number(e.total) }))
    };
  },

  // RF8 - Relatório por Fonte/Destino
  async porFonteDestino(usuarioId, inicio, fim) {
    const [rows] = await pool.execute(
      `SELECT f.id, f.nome, f.tipo,
              COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE 0 END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor ELSE 0 END), 0) AS saidas
       FROM fontes_destinos f
       LEFT JOIN lancamentos l
         ON l.fonte_destino_id = f.id AND l.usuario_id = ? AND l.data BETWEEN ? AND ?
       WHERE f.usuario_id = ?
       GROUP BY f.id, f.nome, f.tipo
       ORDER BY f.tipo ASC, f.nome ASC`,
      [usuarioId, inicio, fim, usuarioId]
    );

    return {
      periodo: { inicio, fim },
      itens: rows.map((r) => {
        const entradas = Number(r.entradas);
        const saidas = Number(r.saidas);
        return {
          id: r.id,
          nome: r.nome,
          tipo: r.tipo,
          entradas,
          saidas,
          saldo: r.tipo === 'conta' ? Number((entradas - saidas).toFixed(2)) : null
        };
      })
    };
  },

  // RF9 - Previsão de Faturas de Cartão de Crédito
  async faturasCartoes(usuarioId, qtdMeses = 4) {
    const [cartoes] = await pool.execute(
      `SELECT id, nome, dia_fechamento, dia_vencimento, limite
       FROM fontes_destinos
       WHERE usuario_id = ? AND tipo = 'cartao_credito'
       ORDER BY nome ASC`,
      [usuarioId]
    );

    const [lancamentosCartao] = await pool.execute(
      `SELECT l.id, l.descricao, l.valor, l.data, l.fonte_destino_id,
              l.parcela_atual, l.total_parcelas, c.nome AS categoria_nome
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'saida'
         AND l.fonte_destino_id IN (
           SELECT id FROM fontes_destinos WHERE usuario_id = ? AND tipo = 'cartao_credito'
         )
       ORDER BY l.data ASC, l.parcela_atual ASC`,
      [usuarioId, usuarioId]
    );

    const hojeStr = new Date().toISOString().slice(0, 10);
    const hojeDt = new Date(`${hojeStr}T00:00:00Z`);
    const mesAtualAno = hojeDt.getUTCFullYear();
    const mesAtualIdx = hojeDt.getUTCMonth();

    // Gera lista de referências YYYY-MM (fatura atual + próximas N)
    const referenciasAlvo = [];
    for (let i = 0; i < qtdMeses; i++) {
      const d = new Date(Date.UTC(mesAtualAno, mesAtualIdx + i, 1));
      referenciasAlvo.push(d.toISOString().slice(0, 7));
    }

    return cartoes.map((cartao) => {
      const comprasDoCartao = lancamentosCartao.filter((l) => l.fonte_destino_id === cartao.id);

      // Calcula fatura de cada lançamento
      const itensComFatura = comprasDoCartao.map((item) => {
        const info = calcularFatura(item.data, cartao, item.parcela_atual);
        return { ...item, ...info };
      });

      // Limite comprometido = soma de todas as parcelas cujo vencimento ainda não passou
      const limiteUtilizado = itensComFatura
        .filter((item) => item.vencimento >= hojeStr)
        .reduce((acc, item) => acc + Number(item.valor), 0);

      const limiteTotal = Number(cartao.limite);
      const limiteDisponivel = Number((limiteTotal - limiteUtilizado).toFixed(2));

      // Agrupa faturas pelo horizonte solicitado
      const faturas = referenciasAlvo.map((ref, idx) => {
        const [anoRef, mesRef] = ref.split('-').map(Number);
        const dtVenc = new Date(Date.UTC(anoRef, mesRef - 1, Math.min(cartao.dia_vencimento, 28)));
        const mesFech = cartao.dia_vencimento > cartao.dia_fechamento ? mesRef - 1 : mesRef - 2;
        const dtFech = new Date(Date.UTC(anoRef, mesFech, Math.min(cartao.dia_fechamento, 28)));

        const lancamentosDaFatura = itensComFatura.filter((i) => i.referencia === ref);
        const total = lancamentosDaFatura.reduce((acc, i) => acc + Number(i.valor), 0);

        return {
          referencia: ref,
          status: idx === 0 ? 'aberta' : 'futura',
          fechamento: lancamentosDaFatura[0]?.fechamento || dtFech.toISOString().slice(0, 10),
          vencimento: lancamentosDaFatura[0]?.vencimento || dtVenc.toISOString().slice(0, 10),
          total: Number(total.toFixed(2)),
          lancamentos: lancamentosDaFatura.map((l) => ({
            id: l.id,
            descricao: l.descricao,
            categoria: l.categoria_nome,
            dataCompra: l.data,
            parcela: `${l.parcela_atual}/${l.total_parcelas}`,
            valor: Number(l.valor)
          }))
        };
      });

      return {
        cartao: {
          id: cartao.id,
          nome: cartao.nome,
          diaFechamento: cartao.dia_fechamento,
          diaVencimento: cartao.dia_vencimento,
          limiteTotal,
          limiteUtilizado: Number(limiteUtilizado.toFixed(2)),
          limiteDisponivel
        },
        faturas
      };
    });
  },

  // Desafio (+10 pts) - Saúde Financeira
  async saudeFinanceira(usuarioId) {
    // 1. Histórico mensal dos últimos 3 meses
    const [mensal] = await pool.execute(
      `SELECT DATE_FORMAT(data, '%Y-%m') AS mes,
              COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) AS saidas
       FROM lancamentos
       WHERE usuario_id = ? AND data >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
       GROUP BY mes
       ORDER BY mes ASC`,
      [usuarioId]
    );

    const qtdMeses = Math.max(1, mensal.length);
    const somaEntradas = mensal.reduce((a, m) => a + Number(m.entradas), 0);
    const somaSaidas = mensal.reduce((a, m) => a + Number(m.saidas), 0);
    const mediaEntradas = somaEntradas / qtdMeses;
    const mediaSaidas = somaSaidas / qtdMeses;

    // 2. Taxa de poupança
    const taxaPoupanca =
      mediaEntradas > 0 ? Number((((mediaEntradas - mediaSaidas) / mediaEntradas) * 100).toFixed(1)) : 0;

    // 3. Regra 50/30/20 no mês atual
    const [regraRows] = await pool.execute(
      `SELECT c.classificacao, COALESCE(SUM(l.valor), 0) AS total
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       WHERE l.usuario_id = ? AND l.tipo = 'saida'
         AND DATE_FORMAT(l.data, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
       GROUP BY c.classificacao`,
      [usuarioId]
    );

    const totalGastosMes = regraRows.reduce((a, r) => a + Number(r.total), 0);
    const mapRegra = new Map(regraRows.map((r) => [r.classificacao, Number(r.total)]));
    const percNecessidades =
      totalGastosMes > 0 ? Number((((mapRegra.get('necessidade') || 0) / totalGastosMes) * 100).toFixed(1)) : 0;
    const percDesejos =
      totalGastosMes > 0 ? Number((((mapRegra.get('desejo') || 0) / totalGastosMes) * 100).toFixed(1)) : 0;

    // 4. Reserva de emergência (contas marcadas como reserva)
    const [reservaRows] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END), 0) AS saldoReserva
       FROM lancamentos l
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id
       WHERE l.usuario_id = ? AND f.reserva = TRUE`,
      [usuarioId]
    );
    const saldoReserva = Math.max(0, Number(reservaRows[0]?.saldoReserva || 0));
    const mesesReserva = mediaSaidas > 0 ? Number((saldoReserva / mediaSaidas).toFixed(1)) : 0;

    // 5. Comprometimento com faturas futuras
    const faturasCartoes = await this.faturasCartoes(usuarioId, 3);
    const totalFaturas3Meses = faturasCartoes.reduce(
      (acc, c) => acc + c.faturas.reduce((s, f) => s + f.total, 0),
      0
    );
    const comprometimentoCartao =
      mediaEntradas > 0 ? Number(((totalFaturas3Meses / 3 / mediaEntradas) * 100).toFixed(1)) : 0;

    // 6. Projeção de saldo para os próximos 4 meses
    const projecao = [];
    let saldoAcumulado = Number((somaEntradas - somaSaidas).toFixed(2));
    const hoje = new Date();

    for (let i = 1; i <= 4; i++) {
      const dt = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + i, 1));
      const ref = dt.toISOString().slice(0, 7);
      const faturasNoMes = faturasCartoes.reduce((acc, c) => {
        const fat = c.faturas.find((f) => f.referencia === ref);
        return acc + (fat ? fat.total : 0);
      }, 0);

      const saldoMes = mediaEntradas - mediaSaidas * 0.7 - faturasNoMes;
      saldoAcumulado = Number((saldoAcumulado + saldoMes).toFixed(2));
      projecao.push({
        mes: ref,
        entradasEstimadas: Number(mediaEntradas.toFixed(2)),
        saidasEstimadas: Number((mediaSaidas * 0.7 + faturasNoMes).toFixed(2)),
        saldoProjetado: saldoAcumulado
      });
    }

    // 7. Geração de dicas baseadas nos indicadores
    const dicas = [];
    if (taxaPoupanca < 10) {
      dicas.push({
        tipo: 'alerta',
        titulo: 'Taxa de poupança abaixo de 10%',
        texto: `Sua taxa média de poupança está em ${taxaPoupanca}%. Tente reservar pelo menos 10% a 20% das entradas mensais.`
      });
    } else {
      dicas.push({
        tipo: 'positivo',
        titulo: 'Boa capacidade de poupança',
        texto: `Você está poupando em média ${taxaPoupanca}% da sua renda mensal. Continue mantendo essa disciplina.`
      });
    }

    if (percDesejos > 30) {
      dicas.push({
        tipo: 'alerta',
        titulo: 'Gastos com desejos acima de 30%',
        texto: `Seus gastos classificados como desejos representam ${percDesejos}% das despesas do mês (referência da regra 50/30/20: até 30%).`
      });
    }

    if (mesesReserva < 3) {
      dicas.push({
        tipo: 'alerta',
        titulo: 'Reserva de emergência em construção',
        texto: `Sua reserva atual (${mesesReserva} meses de despesas) está abaixo da referência recomendada de 3 a 6 meses.`
      });
    } else {
      dicas.push({
        tipo: 'positivo',
        titulo: 'Reserva de emergência sólida',
        texto: `Sua reserva cobre aproximadamente ${mesesReserva} meses do seu custo de vida médio.`
      });
    }

    if (comprometimentoCartao > 35) {
      dicas.push({
        tipo: 'alerta',
        titulo: 'Alto comprometimento no cartão de crédito',
        texto: `As faturas previstas comprometem ${comprometimentoCartao}% da sua renda média mensal. Evite novos parcelamentos longos.`
      });
    }

    return {
      avisoLegal:
        'As informações, indicadores e projeções desta página têm caráter exclusivamente educativo e não constituem recomendação financeira profissional.',
      indicadores: {
        taxaPoupanca,
        comprometimentoCartao,
        mesesReserva,
        saldoReserva: Number(saldoReserva.toFixed(2)),
        regra503020: {
          necessidades: percNecessidades,
          desejos: percDesejos,
          poupanca: Math.max(0, taxaPoupanca)
        }
      },
      projecao,
      dicas
    };
  }
};