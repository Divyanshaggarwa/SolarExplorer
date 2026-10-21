import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { slug, equipment = {} } = req.body;
  const { data, error } = await supabase
    .from('bodies').select('survival_json').eq('slug', slug).single();
  if (error || !data) return res.status(404).json({ error: 'Planet not found' });

  const rules = data.survival_json;
  if (!rules?.requires) return res.status(200).json({ viable: false, reason: rules?.causeOfDeath });

  const ok =
    (equipment.pressureAtm ?? 0) >= rules.requires.pressureAtm &&
    (equipment.oxygen ?? false) === rules.requires.oxygen &&
    equipment.tempC >= rules.requires.tempC[0] &&
    equipment.tempC <= rules.requires.tempC[1] &&
    (equipment.radiationMsvYr ?? Infinity) <= rules.requires.radiationMsvYr;

  res.status(200).json({
    viable: ok,
    reason: ok ? 'Survivable with provided equipment.'
               : `Would die in ~${rules.unprotectedDeathSeconds}s: ${rules.causeOfDeath}`,
    rules: rules.requires,
  });
}