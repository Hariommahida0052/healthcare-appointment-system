import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiUser } from 'react-icons/fi';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const links = { patient: '/patient/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' };
    return links[user.role] || '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <MdLocalHospital className="logo-icon" />
          <span>Health<span className="logo-accent">Care</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar-links">
          <Link to="/doctors" className="nav-link">Find Doctors</Link>
          {!user && <Link to="/login" className="nav-link">Login</Link>}
          {!user && (
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          )}

          {user && (
            <div className="navbar-user">
              <Link to={getDashboardLink()} className="nav-link">Dashboard</Link>
              <div className="user-menu">
                <div className="user-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.fullName} />
                    : <span>{user.fullName?.charAt(0)}</span>
                  }
                </div>
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-name">{user.fullName}</p>
                    <p className="user-role">{user.role}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to={`/${user.role}/profile`} className="dropdown-item">
                    <FiUser /> My Profile
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                    <FiLogOut /> Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/doctors" className="mobile-link" onClick={() => setMenuOpen(false)}>Find Doctors</Link>
          {user && <Link to={getDashboardLink()} className="mobile-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {!user && <Link to="/login" className="mobile-link" onClick={() => setMenuOpen(false)}>Login</Link>}
          {!user && <Link to="/register" className="mobile-link" onClick={() => setMenuOpen(false)}>Register</Link>}
          {user && (
            <button onClick={handleLogout} className="mobile-link mobile-logout">
              <FiLogOut /> Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
