const { supabaseAdmin } = require('../config/supabase');

exports.getAllFines = async (req, res) => {
  try {
    const { status, vehicle_number, district, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('traffic_fines')
      .select(`
        *,
        fine_categories(category_name, amount),
        users(full_name, district)
      `, { count: 'exact' })
      .order('issued_date', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (status)         query = query.eq('status', status);
    if (vehicle_number) query = query.ilike('vehicle_number', `%${vehicle_number}%`);
    if (district)       query = query.eq('district', district);

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
      .from('traffic_fines')
      .select(`*, fine_categories(category_name, amount), users(full_name, district)`)
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
    const {
      vehicle_number, driver_name, driver_license,
      category_id, district, fine_reference
    } = req.body;

    const ref = fine_reference || `TF-${Date.now()}`;

    const { data: fine, error } = await supabaseAdmin
      .from('traffic_fines')
      .insert({
        fine_reference: ref,
        vehicle_number,
        driver_name,
        driver_license,
        category_id,
        district,
        police_officer_id: req.user.id,
        status: 'PENDING',
      })
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
      .from('traffic_fines')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !fine) return res.status(404).json({ message: 'Fine not found' });
    res.json(fine);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFine = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('traffic_fines')
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
    const { count: total }   = await supabaseAdmin.from('traffic_fines').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabaseAdmin.from('traffic_fines').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
    const { count: paid }    = await supabaseAdmin.from('traffic_fines').select('*', { count: 'exact', head: true }).eq('status', 'PAID');
    const { data: revenue }  = await supabaseAdmin.from('payments').select('amount').eq('payment_status', 'SUCCESS');
    const totalRevenue = (revenue || []).reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({ total, pending, paid, totalRevenue });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
