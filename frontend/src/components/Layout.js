import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
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
          {user && (
            <>
              <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Dashboard
              </NavLink>
              <NavLink to="/fines" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Traffic fines
              </NavLink>
              <NavLink to="/fines/new" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                Issue fine
              </NavLink>
              {user.role === 'ADMIN' && (
                <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                  Police users
                </NavLink>
              )}
            </>
          )}
          <NavLink to="/pay" className={({ isActive }) => `nav-item nav-item-pay ${isActive ? 'active' : ''}`}>
            {user ? 'Public payment portal' : 'Pay a traffic fine'}
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-name">{user.full_name}</span>
                <span className="user-role">{user.role} {user.district ? `- ${user.district}` : ''}</span>
              </div>
              <button className="btn-danger logout-btn" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              <div className="user-info">
                <span className="user-name">Public payment access</span>
                <span className="user-role">Search and settle a traffic fine</span>
              </div>
              <Link className="btn-outline compact logout-btn" to="/login">Officer login</Link>
            </>
          )}
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
