import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mascaraCPF, cpfValidoClient } from '../services/api';

export default function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    cpf: '',
    senha: '',
    confirmacaoSenha: ''
  });
  const [errosCampos, setErrosCampos] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { cadastrar } = useAuth();
  const navigate = useNavigate();

  const handleChange = (campo, valor) => {
    const novoValor = campo === 'cpf' ? mascaraCPF(valor) : valor;
    setForm((prev) => ({ ...prev, [campo]: novoValor }));
    setErrosCampos((prev) => ({ ...prev, [campo]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroGeral('');
    const erros = {};

    if (form.nome.trim().length < 3) erros.nome = 'Nome deve ter pelo menos 3 caracteres.';
    if (!cpfValidoClient(form.cpf)) erros.cpf = 'CPF inválido.';
    if (form.senha.length < 8 || !/[a-zA-Z]/.test(form.senha) || !/\d/.test(form.senha)) {
      erros.senha = 'Mínimo 8 caracteres com letras e números.';
    }
    if (form.senha !== form.confirmacaoSenha) {
      erros.confirmacaoSenha = 'As senhas não coincidem.';
    }

    if (Object.keys(erros).length > 0) {
      setErrosCampos(erros);
      return;
    }

    try {
      setCarregando(true);
      await cadastrar(form);
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (err) {
      setErroGeral(err.message || 'Erro ao realizar cadastro.');
      if (err.campos) {
        setErrosCampos(err.campos);
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 style={{ marginBottom: '0.25rem' }}>Criar Conta</h2>
        <p className="text-muted" style={{ marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Categorias e conta inicial são criadas automaticamente
        </p>

        {erroGeral && <div className="alert alert-error">{erroGeral}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo</label>
            <input
              type="text"
              className="form-control"
              value={form.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              required
            />
            {errosCampos.nome && <span className="field-error">{errosCampos.nome}</span>}
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
            {errosCampos.email && <span className="field-error">{errosCampos.email}</span>}
          </div>

          <div className="form-group">
            <label>CPF</label>
            <input
              type="text"
              className="form-control"
              value={form.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              placeholder="000.000.000-00"
              required
            />
            {errosCampos.cpf && <span className="field-error">{errosCampos.cpf}</span>}
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              className="form-control"
              value={form.senha}
              onChange={(e) => handleChange('senha', e.target.value)}
              placeholder="Mín. 8 caracteres (letras e números)"
              required
            />
            {errosCampos.senha && <span className="field-error">{errosCampos.senha}</span>}
          </div>

          <div className="form-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              className="form-control"
              value={form.confirmacaoSenha}
              onChange={(e) => handleChange('confirmacaoSenha', e.target.value)}
              required
            />
            {errosCampos.confirmacaoSenha && (
              <span className="field-error">{errosCampos.confirmacaoSenha}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
          Já possui conta? <Link to="/login">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}