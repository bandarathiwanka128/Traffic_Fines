import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { finesAPI } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentFines, setRecentFines] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      finesAPI.getStats().then((r) => setStats(r.data)).catch(() => {});
    }
    finesAPI.getAll({ limit: 5 }).then((r) => setRecentFines(r.data.fines)).catch(() => {});
  }, [user]);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="welcome">Welcome back, <strong>{user?.name}</strong></p>

      {stats && (
        <div className="stats-grid">
          <StatCard label="Total Fines" value={stats.total} color="#4f46e5" />
          <StatCard label="Unpaid" value={stats.unpaid} color="#ef4444" />
          <StatCard label="Paid" value={stats.paid} color="#22c55e" />
          <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} color="#f59e0b" />
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">Recent Fines</h2>
        {recentFines.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No fines found.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Plate</th><th>Owner</th><th>Violation</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentFines.map((f) => (
                <tr key={f._id}>
                  <td><strong>{f.vehiclePlate}</strong></td>
                  <td>{f.ownerName}</td>
                  <td>{f.violation}</td>
                  <td>${f.amount}</td>
                  <td><span className={`badge badge-${f.status}`}>{f.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="stat-card card">
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={{ color }}>{value}</p>
    </div>
  );
}
