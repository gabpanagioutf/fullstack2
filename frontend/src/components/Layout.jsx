import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleSair = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <header className="navbar">
        <NavLink to="/" className="navbar-brand">
          Finanças FullStack
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/lancamentos">Lançamentos</NavLink>
          <NavLink to="/faturas">Faturas Cartão</NavLink>
          <NavLink to="/relatorios">Relatórios</NavLink>
          <NavLink to="/categorias">Categorias</NavLink>
          <NavLink to="/fontes-destinos">Fontes/Destinos</NavLink>
          <NavLink to="/saude-financeira">Saúde Financeira</NavLink>
        </nav>
        <div className="nav-user">
          <span>Olá, <strong>{usuario?.nome}</strong></span>
          <button onClick={handleSair} className="btn btn-secondary btn-sm">
            Sair
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}