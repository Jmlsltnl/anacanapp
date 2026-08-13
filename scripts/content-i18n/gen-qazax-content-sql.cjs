/**
 * Qazax3+ generatoru — ümumi REGISTRY cədvəlləri üçün kk seed SQL (day-notifications İSTİSNA,
 * onlar ayrıca Qazax4-də VALUES-based bulk UPDATE ilə, performans üçün).
 * out/kk/*.json → guarded per-row UPDATE (COALESCE, idempotent) → supabase/qazax/Qazax3*.sql
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(__dirname, 'out');
const QAZAX_DIR = path.join(ROOT, 'supabase', 'qazax');
const EXCLUDE = new Set(['pregnancy_day_notifications', 'mommy_day_notifications']);

// Sahə tipi təsnifatı (edge function + build-sql.cjs ilə sinxron)
const FIELD_TYPES = {
  pregnancy_daily_content: { arr: ['foods_to_avoid', 'mother_symptoms', 'recommended_exercises', 'recommended_foods', 'tests_to_do'] },
  weekly_tips: { json: ['tips'] },
  admin_recipes: { arr: ['tags'], json: ['ingredients', 'instructions'] },
  baby_crisis_periods: { arrText: ['symptoms', 'tips'] },
  vitamins: { arr: ['benefits', 'food_sources'] },
};
const extraPath = path.join(__dirname, 'registry-extra.json');
if (fs.existsSync(extraPath)) {
  const extra = JSON.parse(fs.readFileSync(extraPath, 'utf8'));
  for (const [t, cfg] of Object.entries(extra)) {
    if (cfg.arr?.length || cfg.json?.length || cfg.arrText?.length) {
      FIELD_TYPES[t] = FIELD_TYPES[t] || {};
      if (cfg.arr?.length) FIELD_TYPES[t].arr = [...new Set([...(FIELD_TYPES[t].arr || []), ...cfg.arr])];
      if (cfg.json?.length) FIELD_TYPES[t].json = [...new Set([...(FIELD_TYPES[t].json || []), ...cfg.json])];
      if (cfg.arrText?.length) FIELD_TYPES[t].arrText = [...new Set([...(FIELD_TYPES[t].arrText || []), ...cfg.arrText])];
    }
  }
}

const esc = (s) => String(s).replace(/'/g, "''");

function sqlValue(table, field, value) {
  const t = FIELD_TYPES[table] || {};
  if ((t.arr || []).includes(field)) {
    const items = Array.isArray(value) ? value : [String(value)];
    return `ARRAY[${items.map((i) => `'${esc(i)}'`).join(', ')}]::text[]`;
  }
  if ((t.json || []).includes(field)) {
    const items = Array.isArray(value) ? value : [String(value)];
    return `'${esc(JSON.stringify(items))}'::jsonb`;
  }
  if ((t.arrText || []).includes(field)) {
    const items = Array.isArray(value) ? value : [String(value)];
    return `'${esc(JSON.stringify(items))}'`;
  }
  return `'${esc(String(value))}'`;
}

(async () => {
  const MAX_BYTES = 800 * 1024;
  const dir = path.join(OUT, 'kk');
  const tableData = {}; // table -> { id -> fields }
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const mergeRows = (table, rows) => {
      if (EXCLUDE.has(table)) return;
      tableData[table] = tableData[table] || {};
      for (const [id, fieldsObj] of Object.entries(rows)) {
        tableData[table][id] = { ...(tableData[table][id] || {}), ...fieldsObj };
      }
    };
    if (path.basename(f).startsWith('_')) {
      for (const [table, rows] of Object.entries(data)) mergeRows(table, rows);
    } else {
      mergeRows(path.basename(f, '.json'), data);
    }
  }

  const lines = [];
  let totalUpdates = 0;
  const perTable = {};

  for (const table of Object.keys(tableData).sort()) {
    const data = tableData[table];
    const ids = Object.keys(data);
    if (!ids.length) continue;
    lines.push(`-- ── ${table} → kk (${ids.length} sətir) ──`);
    for (const id of ids) {
      const fieldsObj = data[id];
      const sets = [];
      for (const [field, value] of Object.entries(fieldsObj)) {
        if (value === null || value === undefined) continue;
        if (typeof value === 'string' && !value.trim()) continue;
        const col = `${field}_kk`;
        sets.push(`${col} = COALESCE(${col}, ${sqlValue(table, field, value)})`);
      }
      if (!sets.length) continue;
      lines.push(`UPDATE public.${table} SET ${sets.join(', ')} WHERE id = '${esc(id)}';`);
      totalUpdates++;
      perTable[table] = (perTable[table] || 0) + 1;
    }
    lines.push('');
  }

  const header = (part, total) => [
    '-- ============================================================',
    `-- Qazax3${total > 1 ? String.fromCharCode(96 + part) : ''} (${part}/${total}) — DB kontentinin Qazax (kk) tərcüməsi`,
    '-- COALESCE + guarded UPDATE — mövcud/əl tərcümələri qorunur (idempotent).',
    `-- Cəmi: ${totalUpdates} UPDATE (day-notifications İSTİSNA — bax Qazax4)`,
    '-- ƏVVƏL Qazax1.sql (sütunlar) işlədilməlidir.',
    '-- ============================================================',
    '',
  ];

  const parts = [];
  let cur = [];
  let curBytes = 0;
  for (const line of lines) {
    const b = Buffer.byteLength(line, 'utf8') + 1;
    if (curBytes + b > MAX_BYTES && cur.length) { parts.push(cur); cur = []; curBytes = 0; }
    cur.push(line);
    curBytes += b;
  }
  if (cur.length) parts.push(cur);

  fs.mkdirSync(QAZAX_DIR, { recursive: true });
  for (const f of fs.readdirSync(QAZAX_DIR).filter((x) => /^Qazax3/.test(x))) fs.unlinkSync(path.join(QAZAX_DIR, f));

  const files = [];
  parts.forEach((partLines, i) => {
    const name = parts.length === 1 ? 'Qazax3.sql' : `Qazax3${String.fromCharCode(97 + i)}.sql`;
    const p = path.join(QAZAX_DIR, name);
    fs.writeFileSync(p, header(i + 1, parts.length).concat(partLines).join('\n'), 'utf8');
    files.push({ name, kb: Math.round(fs.statSync(p).size / 1024) });
  });

  console.log(`✓ ${totalUpdates} UPDATE → ${parts.length} fayl (max ${Math.round(MAX_BYTES / 1024)} KB):`);
  files.forEach((f) => console.log(`   ${f.name}  (${f.kb} KB)`));
  console.log('Cədvəllər üzrə:');
  Object.entries(perTable).sort().forEach(([k, v]) => console.log('  ', k.padEnd(35), v));
})();
