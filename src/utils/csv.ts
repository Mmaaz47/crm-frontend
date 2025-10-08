export type CsvField = keyof any;

function toCsvValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  // Try to serialize date-like strings from API
  const maybeDate = typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v);
  const s = maybeDate ? new Date(v).toISOString() : String(v);
  const needsQuotes = s.includes(',') || s.includes('\n') || s.includes('"');
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv<T extends Record<string, any>>(rows: T[], fields: (keyof T)[], headerLabels?: Record<string, string>) {
  const header = fields.map(f => headerLabels?.[String(f)] ?? String(f)).join(',');
  const lines = rows.map(row => fields.map(f => toCsvValue(row[f])).join(','));
  return [header, ...lines].join('\n');
}

export function downloadCsv(csv: string, filename = 'contacts.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
