import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { full_name: '', email: '', password: '', district: '', phone: '', role: 'POLICE' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = () => usersAPI.getAll().then(({ data }) => setUsers(data));
  useEffect(load, []);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await usersAPI.create(form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create user');
    }
  };

  const update = async (id, changes) => {
    await usersAPI.update(id, changes);
    load();
  };

  const remove = async (id) => {
    if (id === currentUser.id || !window.confirm('Delete this police user?')) return;
    await usersAPI.delete(id);
    load();
  };

  return (
    <div>
      <section className="page-banner">
        <div>
          <p className="banner-kicker">Administration</p>
          <h1 className="banner-title">Police user management</h1>
          <p className="banner-copy">Create officer accounts, assign roles, and keep access clean with a familiar admin workflow.</p>
        </div>
        <div className="banner-actions">
          <span className="banner-pill">{users.length} accounts</span>
          <span className="banner-pill">Role control</span>
        </div>
      </section>
      <div className="card form-card">
        <h2 className="section-title">Create account</h2>
        <form className="user-form" onSubmit={create}>
          <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required minLength="8" type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <button className="btn-primary">Create police account</button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>
      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>District</th><th>Phone</th><th /></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td><td>{user.email}</td>
                  <td>
                    <select value={user.role} disabled={user.id === currentUser.id} onChange={(e) => update(user.id, { role: e.target.value })}>
                      <option value="POLICE">POLICE</option><option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td>{user.district || '-'}</td><td>{user.phone || '-'}</td>
                  <td><button className="btn-danger compact" disabled={user.id === currentUser.id} onClick={() => remove(user.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
