const { supabaseAnon, supabaseAdmin } = require('../config/supabase');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'citizen' } = req.body;

    const { data, error } = await supabaseAnon.auth.signUp({ email, password });
    if (error) return res.status(400).json({ message: error.message });

    // Create profile row with name and role
    await supabaseAdmin.from('profiles').insert({ id: data.user.id, name, role });

    res.status(201).json({
      token: data.session?.access_token,
      user: { id: data.user.id, email, name, role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ message: 'Invalid email or password' });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single();

    res.json({
      token: data.session.access_token,
      user: { id: data.user.id, email, ...profile },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};
