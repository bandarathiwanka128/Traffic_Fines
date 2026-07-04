import React, { useEffect, useState } from 'react';
import { categoriesAPI } from '../services/api';

const emptyForm = { category_name: '', amount: '', description: '' };
const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // { id, category_name, amount, description }

  const load = () => categoriesAPI.getAll().then(({ data }) => setCategories(data));
  useEffect(() => { load(); }, []);

  const create = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await categoriesAPI.create({ ...form, amount: Number(form.amount) });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create category');
    }
  };

  const saveEdit = async () => {
    setError('');
    try {
      await categoriesAPI.update(editing.id, {
        category_name: editing.category_name,
        amount: Number(editing.amount),
        description: editing.description,
      });
      setEditing(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update category');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this fine category?')) return;
    setError('');
    try {
      await categoriesAPI.delete(id);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete category');
    }
  };

  return (
    <div>
      <section className="page-banner">
        <div>
          <p className="banner-kicker">Administration</p>
          <h1 className="banner-title">Fine categories</h1>
          <p className="banner-copy">Define violation types and their fixed penalty amounts. These appear in the issue-fine form and the public payment portal.</p>
        </div>
        <div className="banner-actions">
          <span className="banner-pill">{categories.length} categories</span>
          <span className="banner-pill">Admin only</span>
        </div>
      </section>

      <div className="card form-card">
        <h2 className="section-title">Add category</h2>
        <form className="user-form" onSubmit={create}>
          <input required placeholder="Violation name" value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
          <input required type="number" min="0" step="0.01" placeholder="Amount (LKR)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn-primary">Add category</button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead><tr><th>ID</th><th>Violation</th><th>Amount</th><th>Description</th><th /></tr></thead>
            <tbody>
              {categories.map((category) => {
                const isEditing = editing?.id === category.id;
                return (
                  <tr key={category.id}>
                    <td>{category.id}</td>
                    <td>
                      {isEditing
                        ? <input value={editing.category_name} onChange={(e) => setEditing({ ...editing, category_name: e.target.value })} />
                        : category.category_name}
                    </td>
                    <td>
                      {isEditing
                        ? <input type="number" min="0" step="0.01" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
                        : money(category.amount)}
                    </td>
                    <td>
                      {isEditing
                        ? <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                        : (category.description || '-')}
                    </td>
                    <td>
                      <div className="actions">
                        {isEditing ? (
                          <>
                            <button className="btn-primary compact" type="button" onClick={saveEdit}>Save</button>
                            <button className="btn-outline compact" type="button" onClick={() => setEditing(null)}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-outline compact" type="button" onClick={() => setEditing({ id: category.id, category_name: category.category_name, amount: category.amount, description: category.description || '' })}>Edit</button>
                            <button className="btn-danger compact" type="button" onClick={() => remove(category.id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {categories.length === 0 && (
                <tr><td colSpan="5" className="empty">No fine categories yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
