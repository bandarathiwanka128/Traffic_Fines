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
  const [payments, setPayments] = useState([]);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [{ data: fineData }, { data: paymentData }] = await Promise.all([
      finesAPI.getById(id),
      paymentsAPI.getByFine(id),
    ]);
    setFine(fineData);
    setPayments(paymentData);
  };
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
      <div className="card table-card">
        <h2 className="section-title">Payment history</h2>
        {payments.length === 0 ? (
          <p className="muted">
            No confirmed payment is recorded. A Stripe receipt alone is not enough;
            check the Stripe webhook delivery if the driver completed payment.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>Date</th><th>Method</th><th>Transaction</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.payment_date).toLocaleString()}</td>
                    <td>{formatMethod(payment.payment_method)}</td>
                    <td>{payment.transaction_id || '-'}</td>
                    <td>{money(payment.amount)}</td>
                    <td><span className="badge badge-paid">{payment.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function formatMethod(method = '') {
  const match = method.match(/^(.+):ADMIN:(\d+)$/);
  if (match) return `${match[1]} (confirmed by admin #${match[2]})`;
  return method || '-';
}
