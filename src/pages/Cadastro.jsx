import React, { useState } from 'react';

function App() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function handleCadastro(e) {
    e.preventDefault();

    console.log('Dados cadastrados:', {
      nome,
      email,
      senha
    });

    alert('Cadastro realizado com sucesso!');

    setNome('');
    setEmail('');
    setSenha('');
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <h2 style={styles.title}>Criar Conta</h2>

        <p style={styles.subtitle}>
          Preencha os dados para realizar seu cadastro
        </p>

        <form onSubmit={handleCadastro} style={styles.form}>

          <div style={styles.inputGroup}>
            <label htmlFor="nome" style={styles.label}>
              Nome
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="senha" style={styles.label}>
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Cadastrar
          </button>

        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f4f4f9',
    fontFamily: 'sans-serif'
  },

  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },

  title: {
    margin: '0 0 10px 0',
    color: '#333'
  },

  subtitle: {
    margin: '0 0 30px 0',
    color: '#666',
    fontSize: '14px'
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left'
  },

  label: {
    marginBottom: '8px',
    fontSize: '14px',
    color: '#333',
    fontWeight: 'bold'
  },

  input: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none'
  },

  button: {
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  }
};

export default App;
