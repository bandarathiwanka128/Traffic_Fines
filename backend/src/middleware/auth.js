const { supabaseAnon, supabaseAdmin } = require('../config/supabase');

exports.protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const token = authHeader.split(' ')[1];

  // Verify the Supabase JWT and get the authenticated user
  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }

  // Fetch the profile (role) from our profiles table
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  req.user = { id: user.id, email: user.email, ...profile };
  next();
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};
