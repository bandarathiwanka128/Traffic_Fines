import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo">SL Traffic Fine</span>
          <small>Police Department</small>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/fines" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Traffic fines
          </NavLink>
          <NavLink to="/fines/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            Issue fine
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              Police users
            </NavLink>
          )}
          <a className="nav-item" href="/pay" target="_blank" rel="noreferrer">Public payment portal</a>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.full_name}</span>
            <span className="user-role">{user?.role} {user?.district ? `- ${user.district}` : ''}</span>
          </div>
          <button className="btn-danger logout-btn" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
