import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-wrapper">
      <div className="auth-card card">
        <h1 className="auth-title">Traffic Fine System</h1>
        <p className="auth-subtitle">Create your account</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={form.name} required onChange={set('name')} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} required onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} required minLength={6} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role} onChange={set('role')}>
              <option value="citizen">Citizen</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
}
