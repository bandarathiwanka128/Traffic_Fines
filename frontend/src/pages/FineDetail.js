import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { finesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fine, setFine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    finesAPI.getById(id).then((r) => { setFine(r.data); setLoading(false); });
  }, [id]);

  const handlePay = async () => {
    const updated = await finesAPI.pay(id);
    setFine(updated.data);
  };

  if (loading) return <p>Loading...</p>;
  if (!fine) return <p>Fine not found</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <button className="btn-outline" onClick={() => navigate('/fines')}>Back</button>
        <h1 className="page-title" style={{ margin: 0 }}>Fine Details</h1>
      </div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{fine.vehiclePlate}</h2>
          <span className={`badge badge-${fine.status}`}>{fine.status}</span>
        </div>
        <Detail label="Owner" value={fine.ownerName} />
        <Detail label="Email" value={fine.ownerEmail || '—'} />
        <Detail label="Violation" value={fine.violation} />
        <Detail label="Amount" value={`$${fine.amount}`} />
        <Detail label="Location" value={fine.location} />
        <Detail label="Fine Date" value={new Date(fine.fineDate).toLocaleDateString()} />
        <Detail label="Due Date" value={new Date(fine.dueDate).toLocaleDateString()} />
        {fine.paidAt && <Detail label="Paid At" value={new Date(fine.paidAt).toLocaleDateString()} />}
        {fine.issuedBy && <Detail label="Issued By" value={fine.issuedBy.name} />}
        {fine.notes && <Detail label="Notes" value={fine.notes} />}

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          {fine.status !== 'paid' && (
            <button className="btn-success" onClick={handlePay}>Mark as Paid</button>
          )}
          {(user?.role === 'admin' || user?.role === 'officer') && (
            <button className="btn-outline" onClick={() => navigate(`/fines/${id}/edit`)}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '10px 0' }}>
      <span style={{ width: 120, fontSize: 13, color: '#6b7280', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}
