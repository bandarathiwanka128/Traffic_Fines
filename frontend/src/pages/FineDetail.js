import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import { finesAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function FineDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fine, setFine] = useState(null);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  const load = () => finesAPI.getById(id).then(({ data }) => setFine(data));
  useEffect(load, [id]);

  if (!fine) return <p>Loading fine...</p>;
  const paymentUrl = `${window.location.origin}/pay?reference=${encodeURIComponent(fine.fine_reference)}&category=${fine.category_id}`;

  const confirm = async () => {
    setMessage('');
    try {
      await paymentsAPI.confirm({ fine_id: fine.id, transaction_id: reference });
      setMessage('Payment confirmed and SMS notification queued.');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to confirm payment');
    }
  };

  return (
    <div>
      <div className="page-heading">
        <div><h1 className="page-title">Fine {fine.fine_reference}</h1><p className="muted">Issued {new Date(fine.issued_date).toLocaleString()}</p></div>
        <button className="btn-outline" onClick={() => navigate('/fines')}>Back</button>
      </div>
      <div className="detail-grid">
        <div className="card">
          <div className="detail-header">
            <h2>{fine.vehicle_number}</h2>
            <span className={`badge badge-${fine.status.toLowerCase()}`}>{fine.status}</span>
          </div>
          <Detail label="Driver" value={fine.driver_name || '-'} />
          <Detail label="Licence number" value={fine.driver_license} />
          <Detail label="Fine category" value={`${fine.category_id} - ${fine.fine_categories?.category_name}`} />
          <Detail label="Amount" value={money(fine.fine_categories?.amount)} />
          <Detail label="District" value={fine.district || '-'} />
          <Detail label="Issued by" value={fine.users?.full_name || '-'} />
          <Detail label="Officer phone" value={fine.users?.phone || '-'} />
          {fine.status === 'PENDING' && <button className="btn-outline" onClick={() => navigate(`/fines/${id}/edit`)}>Edit fine</button>}
        </div>
        <div className="card qr-card">
          <h2 className="section-title">Driver payment QR</h2>
          <QRCodeSVG value={paymentUrl} size={210} level="H" />
          <p className="reference-code">{fine.fine_reference}</p>
          <p className="muted">Category identifier: {fine.category_id}</p>
          <button className="btn-outline" onClick={() => navigator.clipboard.writeText(paymentUrl)}>Copy payment link</button>
          {user?.role === 'ADMIN' && fine.status === 'PENDING' && (
            <div className="manual-confirm">
              <label>Bank/counter transaction reference</label>
              <input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional reference" />
              <button className="btn-success" onClick={confirm}>Confirm manual payment</button>
            </div>
          )}
          {message && <p className="notice">{message}</p>}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}
