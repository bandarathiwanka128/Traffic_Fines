import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { finesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;

export default function FinesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ fines: [], total: 0, pages: 1 });
  const [filters, setFilters] = useState({ status: '', vehicle_number: '', page: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      finesAPI.getAll(filters)
        .then(({ data: result }) => setData(result))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filters]);

  const remove = async (id) => {
    if (!window.confirm('Delete this fine permanently?')) return;
    await finesAPI.delete(id);
    setData({ ...data, fines: data.fines.filter((fine) => fine.id !== id) });
  };

  return (
    <div>
      <div className="page-heading">
        <div><h1 className="page-title">Traffic fines</h1><p className="muted">{data.total} records</p></div>
        <button className="btn-primary" onClick={() => navigate('/fines/new')}>Issue new fine</button>
      </div>
      <div className="card filters">
        <input
          placeholder="Search vehicle number"
          value={filters.vehicle_number}
          onChange={(event) => setFilters({ ...filters, vehicle_number: event.target.value, page: 1 })}
        />
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
        </select>
      </div>
      <div className="card table-card">
        {loading ? <p>Loading fines...</p> : (
          <>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Reference</th><th>Vehicle</th><th>Driver</th><th>Category</th><th>Amount</th><th>District</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.fines.map((fine) => (
                    <tr key={fine.id}>
                      <td><Link className="table-link" to={`/fines/${fine.id}`}>{fine.fine_reference}</Link></td>
                      <td>{fine.vehicle_number}</td>
                      <td>{fine.driver_name || '-'}</td>
                      <td>{fine.fine_categories?.category_name}</td>
                      <td>{money(fine.fine_categories?.amount)}</td>
                      <td>{fine.district || '-'}</td>
                      <td><span className={`badge badge-${fine.status.toLowerCase()}`}>{fine.status}</span></td>
                      <td className="actions">
                        <button className="btn-outline compact" onClick={() => navigate(`/fines/${fine.id}`)}>View</button>
                        {fine.status === 'PENDING' && <button className="btn-outline compact" onClick={() => navigate(`/fines/${fine.id}/edit`)}>Edit</button>}
                        {user?.role === 'ADMIN' && <button className="btn-danger compact" onClick={() => remove(fine.id)}>Delete</button>}
                      </td>
                    </tr>
                  ))}
                  {!data.fines.length && <tr><td colSpan="8" className="empty">No fines found.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <button className="btn-outline compact" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
              <span>Page {filters.page} of {data.pages}</span>
              <button className="btn-outline compact" disabled={filters.page >= data.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
