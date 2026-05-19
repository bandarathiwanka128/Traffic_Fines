import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await usersAPI.getAll();
    setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (id === currentUser.id) return alert("Can't delete yourself");
    if (!window.confirm('Delete this user?')) return;
    await usersAPI.delete(id);
    fetchUsers();
  };

  const handleRoleChange = async (id, role) => {
    await usersAPI.update(id, { role });
    fetchUsers();
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>
      <div className="card">
        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} style={{ width: 'auto', padding: '4px 8px' }}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={u._id === currentUser.id}>
                      <option value="citizen">Citizen</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-danger" style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={() => handleDelete(u._id)}
                      disabled={u._id === currentUser.id}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
