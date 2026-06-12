import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function PayFine() {
  const [params] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    fine_reference: params.get('reference') || '',
    category_id: params.get('category') || '',
  });
  const [fine, setFine] = useState(null);
  const [error, setError] = useState(params.get('cancelled') ? 'Payment was cancelled. You can try again.' : '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    publicAPI.categories().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    if (form.fine_reference && form.category_id) {
      publicAPI.lookup(form)
        .then(({ data }) => setFine(data))
        .catch((err) => setError(err.response?.data?.message || 'Fine not found'));
    }
  }, []);

  const lookup = async (event) => {
    event?.preventDefault();
    setError('');
    setFine(null);
    setLoading(true);
    try {
      const { data } = await publicAPI.lookup(form);
      setFine(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Fine not found');
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await publicAPI.checkout(form);
      window.location.assign(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start payment');
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <header className="public-header">
        <div><strong>Sri Lanka Police</strong><span>Official Traffic Fine Payment Portal</span></div>
        <Link to="/login">Officer login</Link>
      </header>
      <main className="public-main">
        <section className="public-intro">
          <p className="eyebrow">Secure online service</p>
          <h1>Pay your traffic fine online</h1>
          <p>Enter the fine reference and category identifier shown on the traffic fine sheet.</p>
        </section>
        <div className="public-grid">
          <form className="card lookup-card" onSubmit={lookup}>
            <h2>Find your fine</h2>
            <div className="form-group">
              <label>Fine reference number</label>
              <input required value={form.fine_reference} onChange={(e) => setForm({ ...form, fine_reference: e.target.value })} placeholder="SLTF-2026-..." />
            </div>
            <div className="form-group">
              <label>Fine category identifier</label>
              <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Select identifier</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.id} - {category.category_name}</option>)}
              </select>
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-primary" disabled={loading}>{loading ? 'Checking...' : 'View fine'}</button>
          </form>
          <div className="card payment-summary">
            {!fine ? (
              <div className="summary-placeholder"><span>Payment details</span><p>Your verified fine details will appear here.</p></div>
            ) : (
              <>
                <div className="detail-header"><h2>{fine.fine_reference}</h2><span className={`badge badge-${fine.status.toLowerCase()}`}>{fine.status}</span></div>
                <Detail label="Vehicle" value={fine.vehicle_number} />
                <Detail label="Driver" value={fine.driver_name || '-'} />
                <Detail label="Violation" value={fine.fine_categories?.category_name} />
                <Detail label="District" value={fine.district || '-'} />
                <div className="amount-due"><span>Amount due</span><strong>{money(fine.fine_categories?.amount)}</strong></div>
                {fine.status === 'PAID'
                  ? <p className="success-msg">This fine has already been paid.</p>
                  : <button className="btn-success pay-button" onClick={pay} disabled={loading}>Pay securely with Stripe</button>}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}
