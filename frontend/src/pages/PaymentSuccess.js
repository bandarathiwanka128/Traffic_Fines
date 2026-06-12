import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicAPI } from '../services/api';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = params.get('session_id');
    if (!sessionId) return setError('Payment session is missing.');
    publicAPI.session(sessionId)
      .then(({ data }) => setResult(data))
      .catch(() => setError('Unable to verify the payment.'));
  }, [params]);

  return (
    <div className="public-shell success-page">
      <div className="card success-card">
        {!result && !error && <p>Verifying payment...</p>}
        {error && <><h1>Verification unavailable</h1><p className="error-msg">{error}</p></>}
        {result && (
          <>
            <div className="success-icon">OK</div>
            <h1>{result.paid ? 'Payment successful' : 'Payment processing'}</h1>
            <p>Fine reference: <strong>{result.fine_reference}</strong></p>
            <p>Amount: <strong>LKR {Number(result.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></p>
            <p className="muted">The police officer notification has been queued after payment confirmation.</p>
          </>
        )}
        <Link className="btn-link" to="/pay">Return to payment portal</Link>
      </div>
    </div>
  );
}
