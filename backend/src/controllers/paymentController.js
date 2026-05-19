const { supabaseAdmin } = require('../config/supabase');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, traffic_fines(fine_reference, vehicle_number)')
      .order('payment_date', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getByFine = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('fine_id', req.params.fineId)
      .order('payment_date', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { fine_id, amount, payment_method, transaction_id } = req.body;

    // Mark the fine as PAID
    await supabaseAdmin
      .from('traffic_fines')
      .update({ status: 'PAID' })
      .eq('id', fine_id);

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({ fine_id, amount, payment_method, transaction_id, payment_status: 'SUCCESS' })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
