const Stripe = require('stripe');
const { supabaseAdmin } = require('../config/supabase');

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const requireStripe = () => {
  if (!stripe) {
    const error = new Error('Stripe is not configured');
    error.status = 503;
    throw error;
  }
};

const recordSuccessfulPayment = async ({ fineId, amount, method, transactionId }) => {
  const { data: existing } = await supabaseAdmin
    .from('payments').select('id').eq('transaction_id', transactionId).maybeSingle();
  if (existing) return existing;

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .insert({
      fine_id: fineId,
      amount,
      payment_method: method,
      transaction_id: transactionId,
      payment_status: 'SUCCESS',
    })
    .select()
    .single();
  if (paymentError) throw paymentError;

  const { error: fineError } = await supabaseAdmin
    .from('traffic_fines')
    .update({ status: 'PAID' })
    .eq('id', fineId)
    .eq('status', 'PENDING');
  if (fineError) throw fineError;

  const { data: fine } = await supabaseAdmin
    .from('traffic_fines')
    .select('fine_reference, users(phone)')
    .eq('id', fineId)
    .single();
  if (fine?.users?.phone) {
    await supabaseAdmin.from('sms_logs').insert({
      fine_id: fineId,
      phone: fine.users.phone,
      message: `Fine ${fine.fine_reference} has been paid. The driving license may be released.`,
      status: 'PENDING',
    });
  }
  return payment;
};

exports.createCheckoutSession = async (req, res) => {
  try {
    requireStripe();
    const { fine_reference, category_id } = req.body;
    const { data: fine, error } = await supabaseAdmin
      .from('traffic_fines')
      .select('id, fine_reference, vehicle_number, status, category_id, fine_categories(category_name, amount)')
      .ilike('fine_reference', (fine_reference || '').trim())
      .eq('category_id', category_id)
      .single();
    if (error || !fine) return res.status(404).json({ message: 'Fine details do not match' });
    if (fine.status === 'PAID') return res.status(409).json({ message: 'This fine is already paid' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: String(fine.id),
      metadata: { fine_id: String(fine.id), fine_reference: fine.fine_reference },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'lkr',
          unit_amount: Math.round(Number(fine.fine_categories.amount) * 100),
          product_data: {
            name: `Traffic fine ${fine.fine_reference}`,
            description: `${fine.fine_categories.category_name} - ${fine.vehicle_number}`,
          },
        },
      }],
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pay?reference=${encodeURIComponent(fine.fine_reference)}&category=${fine.category_id}&cancelled=1`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  try {
    requireStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET)
      return res.status(503).send('Stripe webhook secret is not configured');
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
    if (
      ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)
      && event.data.object.payment_status === 'paid'
    ) {
      const session = event.data.object;
      await recordSuccessfulPayment({
        fineId: Number(session.metadata.fine_id),
        amount: Number(session.amount_total) / 100,
        method: 'STRIPE',
        transactionId: session.payment_intent || session.id,
      });
    }
    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook error: ${err.message}`);
  }
};

exports.getCheckoutStatus = async (req, res) => {
  try {
    requireStripe();
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    if (session.payment_status === 'paid' && session.metadata?.fine_id) {
      await recordSuccessfulPayment({
        fineId: Number(session.metadata.fine_id),
        amount: Number(session.amount_total) / 100,
        method: 'STRIPE',
        transactionId: session.payment_intent || session.id,
      });
    }
    res.json({
      paid: session.payment_status === 'paid',
      fine_reference: session.metadata?.fine_reference,
      amount: session.amount_total ? session.amount_total / 100 : 0,
    });
  } catch {
    res.status(400).json({ message: 'Unable to verify payment session' });
  }
};

exports.getAll = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*, traffic_fines(fine_reference, vehicle_number)')
    .order('payment_date', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.getByFine = async (req, res) => {
  if (req.user.role === 'POLICE') {
    const { data: fine, error: fineError } = await supabaseAdmin
      .from('traffic_fines')
      .select('id')
      .eq('id', req.params.fineId)
      .eq('police_officer_id', req.user.id)
      .maybeSingle();
    if (fineError) return res.status(500).json({ message: fineError.message });
    if (!fine) return res.status(403).json({ message: 'Access denied' });
  }

  const { data, error } = await supabaseAdmin
    .from('payments').select('*').eq('fine_id', req.params.fineId)
    .order('payment_date', { ascending: false });
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};

exports.confirmManualPayment = async (req, res) => {
  try {
    const { fine_id, transaction_id, payment_method = 'MANUAL' } = req.body;
    const { data: fine, error } = await supabaseAdmin
      .from('traffic_fines')
      .select('id, status, fine_categories(amount)')
      .eq('id', fine_id)
      .single();
    if (error || !fine) return res.status(404).json({ message: 'Fine not found' });
    if (fine.status === 'PAID') return res.status(409).json({ message: 'Fine is already paid' });
    const payment = await recordSuccessfulPayment({
      fineId: fine.id,
      amount: Number(fine.fine_categories.amount),
      method: `${payment_method}:ADMIN:${req.user.id}`,
      transactionId: transaction_id || `MANUAL-${Date.now()}`,
    });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
