const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

let onUnauthorizedCallback = null;

export function registrarLogoutAutomatico(fn) {
  onUnauthorizedCallback = fn;
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('financas_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('financas_token');
    localStorage.removeItem('financas_usuario');
    if (onUnauthorizedCallback) onUnauthorizedCallback();
    throw { status: 401, message: 'Sessão expirada. Faça login novamente.' };
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw {
      status: response.status,
      message: data.erro || 'Erro ao comunicar com o servidor.',
      campos: data.campos || {}
    };
  }

  return data;
}

// Utilitários de formatação e máscaras exigidos no item 10.7
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(valor) || 0);
}

export function formatarDataBR(dataISO) {
  if (!dataISO) return '-';
  const [ano, mes, dia] = String(dataISO).slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export function mascaraCPF(valor) {
  return String(valor || '')
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function cpfValidoClient(cpf) {
  const d = String(cpf || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (t) => {
    let s = 0;
    for (let i = 0; i < t; i++) s += Number(d[i]) * (t + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function obterMesAtualRange() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ultimoDia = new Date(ano, hoje.getMonth() + 1, 0).getDate();
  return {
    inicio: `${ano}-${mes}-01`,
    fim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`
  };
}