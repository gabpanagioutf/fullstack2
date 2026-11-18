import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, registrarLogoutAutomatico } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('financas_token'));
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('financas_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  const logout = useCallback(() => {
    localStorage.removeItem('financas_token');
    localStorage.removeItem('financas_usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    registrarLogoutAutomatico(logout);
  }, [logout]);

  const login = async (email, senha) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    localStorage.setItem('financas_token', data.token);
    localStorage.setItem('financas_usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data;
  };

  const cadastrar = async (dados) => {
    return apiRequest('/auth/cadastro', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        autenticado: Boolean(token),
        login,
        logout,
        cadastrar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}