'use client';
import { useState, type FormEvent } from 'react';

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const preview = async (selected?: File) => {
    setError(''); setDone(false); setSummary(''); setFile(null);
    if (!selected) return;
    if (selected.size > 2_500_000) { setError('File terlalu besar.'); return; }
    try {
      const parsed = JSON.parse(await selected.text());
      if (!parsed.data || !Array.isArray(parsed.data.tasks) || !Array.isArray(parsed.data.sessions)) throw new Error();
      setSummary(`${parsed.data.tasks.length} tugas, ${parsed.data.sessions.length} sesi bimbingan, dan ${parsed.data.resources?.length ?? 0} arsip ditemukan.`);
      setFile(selected);
    } catch { setError('Pilih file JSON dari halaman /api/tracker di Skripsync lama.'); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !window.confirm('Impor data ini ke akun Google sekarang?')) return;
    setPending(true); setError('');
    try {
      const response = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: await file.text() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Impor gagal.');
      setDone(true);
    } catch (error) { setError(error instanceof Error ? error.message : 'Impor gagal.'); }
    finally { setPending(false); }
  };
  return <form onSubmit={submit} className="import-form"><label>File progres Skripsync lama<input type="file" accept=".json,application/json" onChange={event => void preview(event.target.files?.[0])} /></label>{summary && <p>{summary}</p>}{error && <p role="alert">{error}</p>}{done ? <p role="status">Data berhasil dipindahkan. Buka dashboard untuk melihatnya.</p> : <button disabled={!file || pending} type="submit">{pending ? 'Mengimpor…' : 'Impor data'}</button>}</form>;
}
