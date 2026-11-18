// Valida os dois dígitos verificadores do CPF
export function cpfValido(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
    return false;
  }
  const digito = (tamanho) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) {
      soma += Number(d[i]) * (tamanho + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

// Sanitiza strings básicas para evitar injeção de tags HTML
export function sanitizarTexto(texto) {
  return String(texto || '')
    .trim()
    .replace(/[<>]/g, '');
}

// Valida formato de data YYYY-MM-DD e existência no calendário
export function dataValida(dataStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dataStr || ''))) return false;
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const dt = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    dt.getUTCFullYear() === ano &&
    dt.getUTCMonth() === mes - 1 &&
    dt.getUTCDate() === dia
  );
}

// Divide um valor em N parcelas exatas em centavos (diferença vai para a 1ª parcela)
export function dividirParcelas(valorTotal, totalParcelas) {
  const totalCentavos = Math.round(Number(valorTotal) * 100);
  const baseCentavos = Math.floor(totalCentavos / totalParcelas);
  const restoCentavos = totalCentavos - baseCentavos * totalParcelas;

  const parcelas = [];
  for (let i = 1; i <= totalParcelas; i++) {
    const centavos = i === 1 ? baseCentavos + restoCentavos : baseCentavos;
    parcelas.push(Number((centavos / 100).toFixed(2)));
  }
  return parcelas;
}

// Utilitários de data UTC para cálculo de faturas (RF9)
function ultimoDiaDoMes(ano, mes) {
  return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function dataSegura(ano, mes, dia) {
  const a = ano + Math.floor(mes / 12);
  const m = ((mes % 12) + 12) % 12;
  return new Date(Date.UTC(a, m, Math.min(dia, ultimoDiaDoMes(a, m))));
}

// Calcula referência, fechamento e vencimento de uma parcela no cartão
export function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
  const [ano, mes, dia] = String(dataCompra).slice(0, 10).split('-').map(Number);
  const m = mes - 1;
  const fechamentoDoMes = Math.min(cartao.dia_fechamento, ultimoDiaDoMes(ano, m));

  // Antes do fechamento: fatura deste mês; no dia ou depois: mês seguinte
  let mesFechamento = dia < fechamentoDoMes ? m : m + 1;
  mesFechamento += numeroParcela - 1;

  const fechamento = dataSegura(ano, mesFechamento, cartao.dia_fechamento);
  const mesVencimento =
    cartao.dia_vencimento > cartao.dia_fechamento ? mesFechamento : mesFechamento + 1;
  const vencimento = dataSegura(ano, mesVencimento, cartao.dia_vencimento);

  const iso = (d) => d.toISOString().slice(0, 10);
  return {
    referencia: iso(vencimento).slice(0, 7),
    fechamento: iso(fechamento),
    vencimento: iso(vencimento)
  };
}