const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./src/controllers/paymentController').stripeWebhook
);
app.use(express.json());

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/fines', require('./src/routes/fines'));
app.use('/api/categories', require('./src/routes/categories'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/public', require('./src/routes/public'));
app.use('/api/sms', require('./src/routes/sms'));
app.use('/api/users', require('./src/routes/users'));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Sri Lanka Traffic Fine API running' });
});

module.exports = app;
