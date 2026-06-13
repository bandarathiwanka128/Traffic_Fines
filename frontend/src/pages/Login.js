import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ '--auth-bg': "url('/login-bg.jpg')" }}>
      <div className="auth-card card">
        <div className="auth-brand">
          <img src="/logo.jpg" alt="Logo" className="auth-logo" />
          <div className="auth-brand-copy">
            <div className="government-mark">SRI LANKA POLICE</div>
            <p className="auth-subtitle auth-subtitle-tight">Official traffic fine portal for officers and administrators</p>
          </div>
        </div>
        <h1 className="auth-title">Traffic Fine Portal</h1>
        <p className="auth-subtitle auth-subtitle-main">Secure access to issue, track, and manage fines with a cleaner workflow.</p>
        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Username or email</label>
            <input
              value={form.identifier}
              required
              autoComplete="username"
              onChange={(event) => setForm({ ...form, identifier: event.target.value })}
              placeholder="admin"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={form.password}
              required
              autoComplete="current-password"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-link"><Link to="/pay">Pay a traffic fine</Link></p>
      </div>
    </div>
  );
}
