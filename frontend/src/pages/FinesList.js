import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { finesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function FinesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ fines: [], total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '', plate: '', page: 1 });
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await finesAPI.getAll(filters);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFines(); }, [filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fine?')) return;
    await finesAPI.delete(id);
    fetchFines();
  };

  const handlePay = async (id) => {
    await finesAPI.pay(id);
    fetchFines();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Traffic Fines</h1>
        {(user?.role === 'admin' || user?.role === 'officer') && (
          <button className="btn-primary" onClick={() => navigate('/fines/new')}>+ New Fine</button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <input placeholder="Search plate..." value={filters.plate}
          onChange={(e) => setFilters({ ...filters, plate: e.target.value, page: 1 })} style={{ maxWidth: 200 }} />
        <select value={filters.status} style={{ maxWidth: 160 }}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <>
            <table>
              <thead>
                <tr><th>Plate</th><th>Owner</th><th>Violation</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.fines.map((f) => (
                  <tr key={f._id}>
                    <td><Link to={`/fines/${f._id}`} style={{ color: '#4f46e5', fontWeight: 600 }}>{f.vehiclePlate}</Link></td>
                    <td>{f.ownerName}</td>
                    <td>{f.violation}</td>
                    <td>${f.amount}</td>
                    <td>{new Date(f.dueDate).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${f.status}`}>{f.status}</span></td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {f.status !== 'paid' && (
                        <button className="btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handlePay(f._id)}>Pay</button>
                      )}
                      {(user?.role === 'admin' || user?.role === 'officer') && (
                        <button className="btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => navigate(`/fines/${f._id}/edit`)}>Edit</button>
                      )}
                      {user?.role === 'admin' && (
                        <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(f._id)}>Del</button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.fines.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af' }}>No fines found</td></tr>
                )}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Total: {data.total} fines</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" style={{ padding: '4px 12px' }}
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Prev</button>
                <span style={{ alignSelf: 'center', fontSize: 13 }}>Page {filters.page} of {data.pages}</span>
                <button className="btn-outline" style={{ padding: '4px 12px' }}
                  disabled={filters.page >= data.pages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
