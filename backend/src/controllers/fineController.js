const { supabaseAdmin } = require('../config/supabase');

exports.getAllFines = async (req, res) => {
  try {
    const { status, plate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('fines')
      .select('*, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (plate) query = query.ilike('vehicle_plate', `%${plate}%`);

    const { data: fines, count, error } = await query;
    if (error) return res.status(500).json({ message: error.message });

    res.json({ fines, total: count, page: Number(page), pages: Math.ceil(count / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFineById = async (req, res) => {
  try {
    const { data: fine, error } = await supabaseAdmin
      .from('fines')
      .select('*, profiles(name, email)')
      .eq('id', req.params.id)
      .single();

    if (error || !fine) return res.status(404).json({ message: 'Fine not found' });
    res.json(fine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFine = async (req, res) => {
  try {
    const { data: fine, error } = await supabaseAdmin
      .from('fines')
      .insert({ ...req.body, issued_by: req.user.id })
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(fine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFine = async (req, res) => {
  try {
    const { data: fine, error } = await supabaseAdmin
      .from('fines')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !fine) return res.status(404).json({ message: 'Fine not found' });
    res.json(fine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.payFine = async (req, res) => {
  try {
    const { data: existing } = await supabaseAdmin
      .from('fines')
      .select('status')
      .eq('id', req.params.id)
      .single();

    if (!existing) return res.status(404).json({ message: 'Fine not found' });
    if (existing.status === 'paid') return res.status(400).json({ message: 'Fine already paid' });

    const { data: fine, error } = await supabaseAdmin
      .from('fines')
      .update({ status: 'paid', paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ message: error.message });
    res.json(fine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteFine = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('fines')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(404).json({ message: 'Fine not found' });
    res.json({ message: 'Fine deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { count: total } = await supabaseAdmin.from('fines').select('*', { count: 'exact', head: true });
    const { count: paid }  = await supabaseAdmin.from('fines').select('*', { count: 'exact', head: true }).eq('status', 'paid');
    const { count: unpaid } = await supabaseAdmin.from('fines').select('*', { count: 'exact', head: true }).eq('status', 'unpaid');
    const { count: disputed } = await supabaseAdmin.from('fines').select('*', { count: 'exact', head: true }).eq('status', 'disputed');
    const { data: revenueRows } = await supabaseAdmin.from('fines').select('amount').eq('status', 'paid');
    const revenue = (revenueRows || []).reduce((sum, r) => sum + Number(r.amount), 0);

    res.json({ total, paid, unpaid, disputed, revenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
