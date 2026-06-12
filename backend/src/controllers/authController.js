const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

exports.login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = (identifier || email || '').trim();
    if (!loginId || !password)
      return res.status(400).json({ message: 'Username/email and password required' });

    let query = supabaseAdmin.from('users').select('*');
    query = loginId.toLowerCase() === 'admin'
      ? query.eq('email', 'admin@trafficfine.gov.lk')
      : query.ilike('email', loginId);
    const { data: user, error } = await query.single();

    if (error || !user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { full_name, email, password, role = 'POLICE', district, phone } = req.body;
    if (!full_name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required' });
    if (!['ADMIN', 'POLICE'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must contain at least 8 characters' });

    const hashed = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ full_name, email, password: hashed, role, district, phone })
      .select('id, full_name, email, role, district, phone, created_at')
      .single();

    if (error) return res.status(400).json({ message: error.message });

    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};
