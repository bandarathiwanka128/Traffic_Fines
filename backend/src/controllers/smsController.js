const { supabaseAdmin } = require('../config/supabase');

exports.getLogs = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('sms_logs')
      .select('*, traffic_fines(fine_reference, vehicle_number)')
      .order('sent_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.send = async (req, res) => {
  try {
    const { fine_id, phone, message } = req.body;

    // TODO: integrate a real SMS provider (Twilio, Vonage, etc.) here
    // For now we just log it as SENT
    const { data, error } = await supabaseAdmin
      .from('sms_logs')
      .insert({ fine_id, phone, message, status: 'SENT' })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json({ message: 'SMS logged', log: data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
