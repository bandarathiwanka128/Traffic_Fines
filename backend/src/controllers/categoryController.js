const { supabaseAdmin } = require('../config/supabase');

exports.getAll = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('fine_categories')
      .select('*')
      .order('category_name');
    if (error) return res.status(500).json({ message: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { category_name, amount, description } = req.body;
    const { data, error } = await supabaseAdmin
      .from('fine_categories')
      .insert({ category_name, amount, description })
      .select()
      .single();
    if (error) return res.status(400).json({ message: error.message });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('fine_categories')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ message: 'Category not found' });
    res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('fine_categories')
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
