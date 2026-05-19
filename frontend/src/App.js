import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FinesList from './pages/FinesList';
import FineForm from './pages/FineForm';
import FineDetail from './pages/FineDetail';
import Users from './pages/Users';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="fines" element={<FinesList />} />
            <Route path="fines/new" element={<PrivateRoute roles={['admin','officer']}><FineForm /></PrivateRoute>} />
            <Route path="fines/:id" element={<FineDetail />} />
            <Route path="fines/:id/edit" element={<PrivateRoute roles={['admin','officer']}><FineForm /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute roles={['admin']}><Users /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
