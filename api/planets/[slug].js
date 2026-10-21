import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const { slug } = req.query;
  const { data, error } = await supabase
    .from('bodies').select('*').eq('slug', slug).single();
  if (error || !data) return res.status(404).json({ error: 'Planet not found' });
  res.status(200).json(data);
}