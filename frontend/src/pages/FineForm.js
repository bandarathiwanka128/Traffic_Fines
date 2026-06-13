import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { categoriesAPI, finesAPI } from '../services/api';
import './FineForm.css';

const initialForm = {
  vehicle_number: '', driver_name: '', driver_license: '',
  category_id: '', district: '', fine_reference: '',
};

export default function FineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoriesAPI.getAll().then(({ data }) => setCategories(data));
    if (id) {
      finesAPI.getById(id).then(({ data }) => setForm({
        vehicle_number: data.vehicle_number,
        driver_name: data.driver_name || '',
        driver_license: data.driver_license,
        category_id: data.category_id,
        district: data.district || '',
        fine_reference: data.fine_reference,
      }));
    }
  }, [id]);

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = id
        ? await finesAPI.update(id, form)
        : await finesAPI.create(form);
      navigate(`/fines/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save fine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="page-banner">
        <div>
          <p className="banner-kicker">Fine workflow</p>
          <h1 className="banner-title">{id ? 'Edit traffic fine' : 'Issue traffic fine'}</h1>
          <p className="banner-copy">Enter the details once and generate a consistent record with QR and payment support.</p>
        </div>
        <div className="banner-actions">
          <span className="banner-pill">Fast entry</span>
          <span className="banner-pill">Secure recordkeeping</span>
        </div>
      </section>
      <div className="form-shell">
        <div className="card form-card form-panel">
          <form onSubmit={submit} className="fine-form">
            <div className="form-row">
              <Field label="Vehicle number *"><input value={form.vehicle_number} required onChange={set('vehicle_number')} placeholder="WP CAB-1234" /></Field>
              <Field label="Driving licence number *"><input value={form.driver_license} required onChange={set('driver_license')} /></Field>
            </div>
            <div className="form-row">
              <Field label="Driver name"><input value={form.driver_name} onChange={set('driver_name')} /></Field>
              <Field label="District"><input value={form.district} onChange={set('district')} placeholder="Officer district by default" /></Field>
            </div>
            <Field label="Fine category *">
              <select value={form.category_id} required onChange={set('category_id')}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.id} - {category.category_name} (LKR {Number(category.amount).toLocaleString()})
                  </option>
                ))}
              </select>
            </Field>
            {!id && <Field label="Reference number (optional)"><input value={form.fine_reference} onChange={set('fine_reference')} placeholder="Automatically generated when empty" /></Field>}
            {error && <p className="error-msg">{error}</p>}
            <div className="button-row">
              <button className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save and generate QR'}</button>
              <button type="button" className="btn-outline" onClick={() => navigate('/fines')}>Cancel</button>
            </div>
          </form>
        </div>
        <aside className="form-aside">
          <div className="info-card">
            <h3>Helpful tips</h3>
            <p>Keep the vehicle number and driving licence number exactly as shown on the roadside record to avoid mismatches later.</p>
            <div className="info-list">
              <div className="info-item"><span>Reference</span><strong>Auto if blank</strong></div>
              <div className="info-item"><span>Status</span><strong>PENDING</strong></div>
              <div className="info-item"><span>Payment</span><strong>QR + Stripe</strong></div>
            </div>
          </div>
          <div className="info-card">
            <h3>What happens next</h3>
            <p>The system generates the fine record, attaches the selected category amount, and makes it available to the public portal immediately.</p>
          </div>
        </aside>
          </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="form-group"><label>{label}</label>{children}</div>;
}
