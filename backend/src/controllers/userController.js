const { supabaseAdmin } = require('../config/supabase');

exports.getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ message: error.message });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;
    const { data: user, error } = await supabaseAdmin
      .from('profiles')
      .update({ name, role })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Delete from Supabase Auth (cascades to profiles via FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (error) return res.status(404).json({ message: error.message });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
