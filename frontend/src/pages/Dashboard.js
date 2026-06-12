import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { finesAPI } from '../services/api';
import './Dashboard.css';

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (user?.role === 'ADMIN') finesAPI.getStats().then(({ data }) => setStats(data));
    finesAPI.getAll({ limit: 5 }).then(({ data }) => setRecent(data.fines));
  }, [user]);

  return (
    <div>
      <h1 className="page-title">Collection dashboard</h1>
      <p className="welcome">Welcome, <strong>{user?.full_name}</strong></p>

      {stats && (
        <>
          <div className="stats-grid">
            <StatCard label="Total fines" value={stats.total} />
            <StatCard label="Pending" value={stats.pending} />
            <StatCard label="Paid" value={stats.paid} />
            <StatCard label="Total collection" value={money(stats.totalRevenue)} />
          </div>
          <div className="report-grid">
            <Breakdown title="District-wise collections" rows={stats.byDistrict} />
            <Breakdown title="Fine category collections" rows={stats.byCategory} />
          </div>
        </>
      )}

      <div className="card table-card">
        <div className="section-heading">
          <h2 className="section-title">Recent fines</h2>
          <Link to="/fines">View all</Link>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Reference</th><th>Vehicle</th><th>Category</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map((fine) => (
                <tr key={fine.id}>
                  <td><Link className="table-link" to={`/fines/${fine.id}`}>{fine.fine_reference}</Link></td>
                  <td>{fine.vehicle_number}</td>
                  <td>{fine.fine_categories?.category_name}</td>
                  <td>{money(fine.fine_categories?.amount)}</td>
                  <td><span className={`badge badge-${fine.status.toLowerCase()}`}>{fine.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return <div className="stat-card card"><p className="stat-label">{label}</p><p className="stat-value">{value}</p></div>;
}

function Breakdown({ title, rows = [] }) {
  return (
    <div className="card">
      <h2 className="section-title">{title}</h2>
      <div className="breakdown-list">
        {rows.length ? rows.map((row) => (
          <div className="breakdown-row" key={row.name}><span>{row.name}</span><strong>{money(row.amount)}</strong></div>
        )) : <p className="muted">No paid fines yet.</p>}
      </div>
    </div>
  );
}
