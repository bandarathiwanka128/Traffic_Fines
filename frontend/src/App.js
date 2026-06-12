import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FinesList from './pages/FinesList';
import FineForm from './pages/FineForm';
import FineDetail from './pages/FineDetail';
import Users from './pages/Users';
import PayFine from './pages/PayFine';
import PaymentSuccess from './pages/PaymentSuccess';

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
          <Route path="/pay" element={<PayFine />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="fines" element={<FinesList />} />
            <Route path="fines/new" element={<FineForm />} />
            <Route path="fines/:id" element={<FineDetail />} />
            <Route path="fines/:id/edit" element={<FineForm />} />
            <Route path="users" element={
              <PrivateRoute roles={['ADMIN']}><Users /></PrivateRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/pay" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
