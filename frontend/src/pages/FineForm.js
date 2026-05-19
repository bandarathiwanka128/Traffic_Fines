import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { finesAPI } from '../services/api';
import './FineForm.css';

const VIOLATIONS = [
  'Speeding', 'Red Light Violation', 'Illegal Parking', 'No Seatbelt',
  'Using Phone While Driving', 'No Insurance', 'DUI', 'Reckless Driving',
  'Wrong Way Driving', 'Expired Registration',
];

const defaultForm = {
  vehiclePlate: '', ownerName: '', ownerEmail: '', violation: '',
  amount: '', location: '', dueDate: '', status: 'unpaid', notes: '',
};

export default function FineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      finesAPI.getById(id).then((r) => {
        const f = r.data;
        setForm({
          vehiclePlate: f.vehiclePlate, ownerName: f.ownerName, ownerEmail: f.ownerEmail || '',
          violation: f.violation, amount: f.amount, location: f.location,
          dueDate: f.dueDate?.slice(0, 10), status: f.status, notes: f.notes || '',
        });
      });
    }
  }, [id, isEdit]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) await finesAPI.update(id, form);
      else await finesAPI.create(form);
      navigate('/fines');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save fine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">{isEdit ? 'Edit Fine' : 'Issue New Fine'}</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="fine-form">
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Plate *</label>
              <input value={form.vehiclePlate} required onChange={set('vehiclePlate')} placeholder="e.g. ABC-1234" />
            </div>
            <div className="form-group">
              <label>Owner Name *</label>
              <input value={form.ownerName} required onChange={set('ownerName')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Owner Email</label>
              <input type="email" value={form.ownerEmail} onChange={set('ownerEmail')} />
            </div>
            <div className="form-group">
              <label>Violation *</label>
              <select value={form.violation} required onChange={set('violation')}>
                <option value="">Select violation</option>
                {VIOLATIONS.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Fine Amount ($) *</label>
              <input type="number" min="1" value={form.amount} required onChange={set('amount')} />
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <input type="date" value={form.dueDate} required onChange={set('dueDate')} />
            </div>
          </div>
          <div className="form-group">
            <label>Location *</label>
            <input value={form.location} required onChange={set('location')} placeholder="e.g. Main St & 5th Ave" />
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={set('status')}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} />
          </div>
          {error && <p className="error-msg">{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Fine' : 'Issue Fine'}
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate('/fines')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
