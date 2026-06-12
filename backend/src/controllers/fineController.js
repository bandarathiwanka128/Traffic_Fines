const { supabaseAdmin } = require('../config/supabase');

const fineSelect = `
  *,
  fine_categories(category_name, amount, description),
  users(full_name, district, phone)
`;

exports.getAllFines = async (req, res) => {
  try {
    const { status, vehicle_number, district, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 100);
    const offset = (pageNumber - 1) * pageSize;

    let query = supabaseAdmin
      .from('traffic_fines')
      .select(fineSelect, { count: 'exact' })
      .order('issued_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (req.user.role === 'POLICE') query = query.eq('police_officer_id', req.user.id);
    if (status) query = query.eq('status', status);
    if (vehicle_number) query = query.ilike('vehicle_number', `%${vehicle_number}%`);
    if (district) query = query.eq('district', district);

    const { data: fines, count, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    res.json({
      fines,
      total: count,
      page: pageNumber,
      pages: Math.max(Math.ceil(count / pageSize), 1),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFineById = async (req, res) => {
  try {
    const { data: fine, error } = await supabaseAdmin
      .from('traffic_fines')
      .select(fineSelect)
      .eq('id', req.params.id)
      .single();
    if (error || !fine) return res.status(404).json({ message: 'Fine not found' });
    if (req.user.role === 'POLICE' && fine.police_officer_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(fine);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFine = async (req, res) => {
  try {
    const {
      vehicle_number, driver_name, driver_license,
      category_id, district, fine_reference,
    } = req.body;
    if (!vehicle_number || !driver_license || !category_id)
      return res.status(400).json({ message: 'Vehicle, license and fine category are required' });

    const reference = fine_reference
      || `SLTF-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const { data: fine, error } = await supabaseAdmin
      .from('traffic_fines')
      .insert({
        fine_reference: reference,
        vehicle_number: vehicle_number.toUpperCase(),
        driver_name,
        driver_license,
        category_id,
        district: district || req.user.district,
        police_officer_id: req.user.id,
        status: 'PENDING',
      })
      .select(fineSelect)
      .single();
    if (error) return res.status(400).json({ message: error.message });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.status(201).json({
      ...fine,
      payment_url: `${frontendUrl}/pay?reference=${encodeURIComponent(reference)}&category=${category_id}`,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFine = async (req, res) => {
  try {
    const allowed = ['vehicle_number', 'driver_name', 'driver_license', 'category_id', 'district'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );
    if (updates.vehicle_number) updates.vehicle_number = updates.vehicle_number.toUpperCase();

    let query = supabaseAdmin
      .from('traffic_fines')
      .update(updates)
      .eq('id', req.params.id)
      .eq('status', 'PENDING');
    if (req.user.role === 'POLICE') query = query.eq('police_officer_id', req.user.id);
    const { data, error } = await query.select(fineSelect).single();
    if (error || !data) return res.status(404).json({ message: 'Fine not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFine = async (req, res) => {
  const { error } = await supabaseAdmin.from('traffic_fines').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ message: error.message });
  res.json({ message: 'Fine deleted' });
};

exports.getStats = async (req, res) => {
  try {
    const { count: total } = await supabaseAdmin
      .from('traffic_fines').select('*', { count: 'exact', head: true });
    const { count: pending } = await supabaseAdmin
      .from('traffic_fines').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
    const { count: paid } = await supabaseAdmin
      .from('traffic_fines').select('*', { count: 'exact', head: true }).eq('status', 'PAID');
    const { data: revenue } = await supabaseAdmin
      .from('payments').select('amount').eq('payment_status', 'SUCCESS');
    const totalRevenue = (revenue || []).reduce((sum, payment) => sum + Number(payment.amount), 0);

    const { data: paidFines, error } = await supabaseAdmin
      .from('traffic_fines')
      .select('district, fine_categories(category_name, amount)')
      .eq('status', 'PAID');
    if (error) return res.status(500).json({ message: error.message });

    const districts = {};
    const categories = {};
    for (const fine of paidFines || []) {
      const amount = Number(fine.fine_categories?.amount || 0);
      const district = fine.district || 'Unknown';
      const category = fine.fine_categories?.category_name || 'Unknown';
      districts[district] = (districts[district] || 0) + amount;
      categories[category] = (categories[category] || 0) + amount;
    }

    res.json({
      total, pending, paid, totalRevenue,
      byDistrict: Object.entries(districts).map(([name, amount]) => ({ name, amount })),
      byCategory: Object.entries(categories).map(([name, amount]) => ({ name, amount })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
