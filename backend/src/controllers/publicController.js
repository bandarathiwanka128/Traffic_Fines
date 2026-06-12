const { supabaseAdmin } = require('../config/supabase');

exports.lookupFine = async (req, res) => {
  try {
    const { fine_reference, category_id } = req.body;
    if (!fine_reference || !category_id)
      return res.status(400).json({ message: 'Fine reference and category identifier are required' });

    const { data, error } = await supabaseAdmin
      .from('traffic_fines')
      .select(`
        id, fine_reference, vehicle_number, driver_name, district, status,
        issued_date, category_id, fine_categories(category_name, amount, description),
        users(full_name)
      `)
      .ilike('fine_reference', fine_reference.trim())
      .eq('category_id', category_id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Fine details do not match' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicCategories = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('fine_categories')
    .select('id, category_name, amount')
    .order('category_name');
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
};
