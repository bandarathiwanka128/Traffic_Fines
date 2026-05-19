const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, district, phone, created_at')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { full_name, email, role, district, phone, password } = req.body;
    const updates = { full_name, email, role, district, phone };
    if (password) updates.password = await bcrypt.hash(password, 10);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, full_name, email, role, district, phone, created_at')
      .single();

    if (error || !data) return res.status(404).json({ message: 'User not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
