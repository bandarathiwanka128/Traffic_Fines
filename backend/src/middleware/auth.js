const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

exports.protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized' });

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role, district, phone')
      .eq('id', decoded.id)
      .single();

    if (error || !user)
      return res.status(401).json({ message: 'User not found' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  next();
};
